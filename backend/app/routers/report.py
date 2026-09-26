import json
from datetime import timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import AnalyzeResponse
from ..utils.pdf_builder import build_pdf
from .. import crud

router = APIRouter(prefix="/report", tags=["report"])


@router.get("/{analysis_id}", response_model=AnalyzeResponse)
def get_report(analysis_id: str, db: Session = Depends(get_db)):
    """Retrieve the full trust report for a previously analyzed response."""
    analysis = crud.get_analysis(db, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    scores_map = {
        s.metric: {"score": s.score, "explanation": s.explanation}
        for s in analysis.scores
    }
    bias_flags = [bf.flag for bf in analysis.bias_flags]

    # Restore persisted recommendations (Q3 fix)
    try:
        stored_recs = json.loads(analysis.recommendations or "[]")
    except (json.JSONDecodeError, TypeError):
        stored_recs = []

    trust_level = _score_to_level(analysis.trust_score)

    trust_report = {
        "overall_trust_score": analysis.trust_score,
        "trust_level":         trust_level,
        "summary":             analysis.summary or "",
        "recommendations":     stored_recs,
    }

    # Reconstruct a minimal trust_engine payload so the schema validates (Q2 fix)
    trust_engine_payload = {
        "trust_score":     round(analysis.trust_score * 100),
        "trust_level":     trust_level,
        "signals": {
            "unsupported_claims": {
                "count": 0, "matches": [], "evidence_count": 0,
                "net_unsupported": 0, "penalty": 0,
                "explanation": "Detail available only on the original analysis.",
            },
            "uncertainty_words": {
                "count": 0, "matches": [], "penalty": 0,
                "explanation": "Detail available only on the original analysis.",
            },
            "missing_evidence": {
                "unsupported_sentence_count": 0, "total_sentences": 0,
                "factual_sentence_count": 0, "penalty": 0,
                "explanation": "Detail available only on the original analysis.",
            },
            "claim_specificity": {
                "specific_claim_count": 0, "evidence_count": 0,
                "net_unsourced": 0, "penalty": 0,
                "explanation": "Detail available only on the original analysis.",
            },
        },
        "recommendations": stored_recs,
        "summary":         analysis.summary or "",
    }

    return AnalyzeResponse(
        id=analysis.id,
        trust_score=analysis.trust_score,
        hallucination_risk=analysis.hallucination_risk,
        bias_flags=bias_flags,
        confidence_score=analysis.confidence_score,
        summary=analysis.summary or "",
        scores=scores_map,
        trust_report=trust_report,
        trust_engine=trust_engine_payload,
        created_at=analysis.created_at,
    )


def _score_to_level(score: float) -> str:
    if score >= 0.75:
        return "HIGH"
    if score >= 0.50:
        return "MODERATE"
    if score >= 0.25:
        return "LOW"
    return "CRITICAL"


@router.get(
    "/{analysis_id}/pdf",
    summary="Download trust analysis report as PDF",
    response_class=Response,
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "PDF file download",
        },
        404: {"description": "Analysis not found"},
    },
)
def download_pdf(analysis_id: str, db: Session = Depends(get_db)):
    """
    Generate and stream a styled PDF trust report for the given analysis.

    The PDF contains:
      - Original prompt and AI response
      - Trust score gauge bar and overview badges
      - Per-signal findings table
      - Recommendations

    Returns a ``Content-Disposition: attachment`` response so the browser
    triggers a file download immediately.
    """
    analysis = crud.get_analysis(db, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    scores_map = {
        s.metric: {"score": s.score, "explanation": s.explanation}
        for s in analysis.scores
    }
    bias_flags = [bf.flag for bf in analysis.bias_flags]

    try:
        stored_recs = json.loads(analysis.recommendations or "[]")
    except (json.JSONDecodeError, TypeError):
        stored_recs = []

    trust_level = _score_to_level(analysis.trust_score)

    # Format created_at for the PDF header
    if analysis.created_at:
        try:
            dt = analysis.created_at
            if dt.tzinfo is None:
                from datetime import timezone as _tz
                dt = dt.replace(tzinfo=_tz.utc)
            created_str = dt.strftime("%Y-%m-%d %H:%M UTC")
        except Exception:
            created_str = str(analysis.created_at)
    else:
        created_str = "Unknown"

    pdf_bytes = build_pdf(
        analysis_id=analysis.id,
        prompt=analysis.prompt,
        response=analysis.response,
        trust_score=analysis.trust_score,
        trust_score_100=round(analysis.trust_score * 100),
        trust_level=trust_level,
        hallucination_risk=analysis.hallucination_risk,
        confidence_score=analysis.confidence_score,
        summary=analysis.summary or "",
        scores=scores_map,
        bias_flags=bias_flags,
        recommendations=stored_recs,
        created_at=created_str,
    )

    filename = f"echotrace-report-{analysis.created_at.strftime('%Y-%m-%d') if analysis.created_at else 'report'}-{analysis.id[:8]}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
