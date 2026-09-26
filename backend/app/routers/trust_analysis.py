"""
POST /trust-analysis
====================
Dedicated endpoint for the Trust Analysis Engine.

Input  : { "prompt": str, "response": str }
Output : TrustAnalysisResponse — trust_score, hallucination_risk,
         confidence_score, trust_level, explanation, summary,
         recommendations, signals (full per-detector breakdown).

This router runs only the trust_engine (six heuristic detectors) and does
NOT persist to the database — it is a stateless, fast analysis call.
Use POST /analyze for the full five-engine pipeline with DB persistence.
"""

from fastapi import APIRouter
from ..schemas import TrustAnalysisRequest, TrustAnalysisResponse
from ..engines import trust_engine

router = APIRouter(prefix="/trust-analysis", tags=["trust-analysis"])


@router.post(
    "",
    response_model=TrustAnalysisResponse,
    summary="Run Trust Analysis Engine",
    description=(
        "Analyse an AI-generated response against the original prompt. "
        "Detects unsupported claims, uncertainty words, missing citations, "
        "contradictions, overconfident statements, and claim specificity. "
        "Returns a 0–100 trust score, hallucination risk, confidence score, "
        "and a full per-signal breakdown."
    ),
)
def run_trust_analysis(payload: TrustAnalysisRequest) -> TrustAnalysisResponse:
    """
    Stateless trust analysis — no DB write, returns immediately.

    Parameters
    ----------
    payload.prompt : str
        The original prompt sent to the AI (used for citation cross-check).
    payload.response : str
        The AI-generated response to analyse.

    Returns
    -------
    TrustAnalysisResponse with:
      - trust_score         int 0–100  (higher = more trustworthy)
      - hallucination_risk  LOW | MEDIUM | HIGH
      - confidence_score    float 0.0–1.0
      - trust_level         HIGH | MODERATE | LOW | CRITICAL
      - explanation         full human-readable analysis
      - summary             one-sentence verdict
      - recommendations     actionable list of concerns
      - signals             per-detector breakdown
    """
    result = trust_engine.analyze(payload.response, prompt=payload.prompt)

    return TrustAnalysisResponse(
        trust_score=result["trust_score"],
        hallucination_risk=result["hallucination_risk"],
        confidence_score=result["confidence_score"],
        trust_level=result["trust_level"],
        explanation=result["explanation"],
        summary=result["summary"],
        recommendations=result["recommendations"],
        signals=result["signals"],
    )
