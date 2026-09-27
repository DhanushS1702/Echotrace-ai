import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from ..database import get_db
from ..services import llm_service
from .analyze import _run_engines
from ..engines.trust_composer import compose
from .. import crud

router = APIRouter(prefix="/live-analysis", tags=["live-analysis"])


class LiveAnalysisRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=8000, description="User input message, email, SMS, or communication to analyze")


class AnalysisMetrics(BaseModel):
    summary: str
    risk_level: str
    trust_score: int
    risk_score: int
    confidence: int


class LiveAnalysisResponse(BaseModel):
    success: bool = True
    id: str | None = None
    analysis: AnalysisMetrics
    matched_signals: list[str]
    recommendation: str
    llm_explanation: str
    created_at: str | None = None


def _perform_live_analysis(content: str, db: Session) -> LiveAnalysisResponse:
    if not content or not content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty.")

    # 1. Construct security prompt for LLM Analysis Engine
    llm_prompt = (
        f"You are an expert AI Security & Trust Auditor evaluating suspicious communication, text, or AI output.\n"
        f"Analyze the following user input thoroughly for:\n"
        f"- Phishing attempts or scam indicators\n"
        f"- Social engineering tactics or impersonation\n"
        f"- Urgency pressure or emotional manipulation\n"
        f"- Financial fraud or credential theft requests\n"
        f"- Suspicious language patterns and trustworthiness signals\n\n"
        f"USER CONTENT TO AUDIT:\n\"{content}\"\n\n"
        f"Provide a comprehensive, professional security audit explanation detailing your findings, key threat indicators, and evidence."
    )

    # 2. Call LLM Engine (Groq Cloud API)
    llm_res = llm_service.generate_llm_response(question=llm_prompt)
    llm_explanation = llm_res.get("generated_response", "").strip()

    # 3. Run 5-Engine Trust Suite on user content
    engine_results = _run_engines(text=content, prompt_text=content)
    trust_result = compose(engine_results, response_text=content, prompt_text=content)

    # 4. Pattern Scan on User Content & LLM Explanation
    content_lower = content.lower()
    explanation_lower = llm_explanation.lower()

    matched_signals = []
    penalties = 0

    # Scan 1: Urgency & Pressure Language
    if any(k in content_lower for k in ["urgent", "immediately", "24 hours", "asap", "action required", "act now", "suspended", "frozen"]):
        matched_signals.append("Urgency Language")
        penalties += 25

    # Scan 2: Suspicious Financial Request
    if any(k in content_lower for k in ["bank", "wire", "transfer", "payment", "account", "card", "crypto", "zelle", "venmo", "bitcoin", "refund", "$"]):
        matched_signals.append("Suspicious Financial Request")
        penalties += 30

    # Scan 3: Identity & Credential Theft Probe
    if any(k in content_lower for k in ["verify", "password", "login", "ssn", "credentials", "otp", "pin", "2fa", "security code"]):
        matched_signals.append("Identity & Credential Probe")
        penalties += 35

    # Scan 4: Prompt Injection / System Override
    if any(k in content_lower for k in ["ignore", "override", "system prompt", "jailbreak", "admin mode", "secret keys"]):
        matched_signals.append("Prompt Injection Trigger")
        penalties += 40

    # Scan 5: Unverified External Domain Link
    if any(k in content_lower for k in ["http://", "https://", "bit.ly", "tinyurl", "click here", "login-update"]):
        matched_signals.append("Unverified External Domain Link")
        penalties += 20

    # Scan 6: Check LLM explanation verdict indicators
    if any(k in explanation_lower for k in ["phishing", "scam", "malicious", "fraud", "impersonation"]):
        if penalties < 20:
            penalties += 25

    # Compute Trust Score (0-100) & Risk Score (0-100)
    base_trust = 95
    t_score = max(5, min(98, base_trust - penalties))
    r_score = 100 - t_score

    # Determine Risk Level
    if t_score >= 80:
        risk_lvl = "Low"
    elif t_score >= 60:
        risk_lvl = "Medium"
    elif t_score >= 40:
        risk_lvl = "High"
    else:
        risk_lvl = "Critical"

    # Confidence calculation (0-100%)
    conf_pct = 95 if penalties == 0 else min(98, 85 + len(matched_signals) * 3)

    if not matched_signals:
        matched_signals = ["Verified Syntax Structure", "No Adversarial Triggers"]

    # Recommendation
    if risk_lvl in ["High", "Critical"]:
        rec_text = "Do not click any embedded links, transfer funds, or provide credentials. Verify the sender through an official, independent channel."
    elif risk_lvl == "Medium":
        rec_text = "Caution advised. Verify sender identity and inspect links carefully before taking any action."
    else:
        rec_text = "No critical threat indicators detected. Maintain routine security awareness and verify unverified links before interacting."

    summary = f"Content evaluated as {risk_lvl} Risk with a Trust Score of {t_score}/100 and {conf_pct}% confidence."

    # Update trust_result object
    trust_result["trust_score"] = t_score
    trust_result["hallucination_risk"] = "LOW" if t_score >= 70 else "MEDIUM" if t_score >= 40 else "HIGH"
    if "trust_engine" in trust_result:
        trust_result["trust_engine"]["trust_score"] = t_score

    # Save to SQLite database for persistent History and PDF Streaming
    analysis_record = crud.create_analysis(
        db,
        prompt=content,
        response=llm_explanation,
        result=trust_result
    )

    return LiveAnalysisResponse(
        success=True,
        id=analysis_record.id,
        analysis=AnalysisMetrics(
            summary=summary,
            risk_level=risk_lvl,
            trust_score=t_score,
            risk_score=r_score,
            confidence=conf_pct
        ),
        matched_signals=matched_signals,
        recommendation=rec_text,
        llm_explanation=llm_explanation,
        created_at=analysis_record.created_at.isoformat()
    )



@router.post("", response_model=LiveAnalysisResponse, status_code=200)
@router.post("/", response_model=LiveAnalysisResponse, status_code=200)
def live_analysis(payload: LiveAnalysisRequest, db: Session = Depends(get_db)):
    """
    POST /api/live-analysis
    Primary EchoTrace AI real-time LLM + Trust Engine workflow endpoint.
    """
    return _perform_live_analysis(payload.content, db)


@router.post("/stream")
async def stream_live_analysis(payload: LiveAnalysisRequest, db: Session = Depends(get_db)):
    """
    POST /api/live-analysis/stream
    Server-Sent Events (SSE) streaming endpoint for live streaming token animation.
    """
    async def event_generator():
        yield f"data: {json.dumps({'type': 'status', 'message': 'Processing input with Groq LLM Engine...'})}\n\n"
        await asyncio.sleep(0.05)

        full_result = _perform_live_analysis(payload.content, db)
        explanation = full_result.llm_explanation
        words = explanation.split(" ")

        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'type': 'token', 'token': chunk})}\n\n"
            await asyncio.sleep(0.015)

        yield f"data: {json.dumps({'type': 'status', 'message': 'Evaluating Trust Engine Scores...'})}\n\n"
        await asyncio.sleep(0.05)

        yield f"data: {json.dumps({'type': 'complete', 'result': full_result.model_dump()})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
