from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import AnalyzeRequest, AnalyzeResponse
from ..engines import confidence, hallucination, bias, missing_evidence, prompt_injection
from ..engines.trust_composer import EngineResults, compose
from .. import crud

router = APIRouter(prefix="/analyze", tags=["analyze"])


def _run_engines(text: str, prompt_text: str) -> EngineResults:
    """Run all five engines concurrently and return collected results."""
    tasks = {
        "confidence":       lambda: confidence.analyze(text),
        "hallucination":    lambda: hallucination.analyze(text),
        "bias":             lambda: bias.analyze(text),
        "missing_evidence": lambda: missing_evidence.analyze(text),
        # Scan both response and prompt for injection; take the higher score
        "prompt_injection": lambda: _max_injection(text, prompt_text),
    }

    results = {}
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(fn): key for key, fn in tasks.items()}
        for future in as_completed(futures):
            results[futures[future]] = future.result()

    return EngineResults(
        confidence=results["confidence"],
        hallucination=results["hallucination"],
        missing_evidence=results["missing_evidence"],
        bias=results["bias"],
        prompt_injection=results["prompt_injection"],
    )


def _max_injection(response_text: str, prompt_text: str) -> dict:
    """Return whichever injection scan (prompt vs response) scores higher."""
    resp = prompt_injection.analyze(response_text)
    prom = prompt_injection.analyze(prompt_text)
    return prom if prom["score"] > resp["score"] else resp


@router.post("", response_model=AnalyzeResponse, status_code=201)
def analyze(payload: AnalyzeRequest, db: Session = Depends(get_db)):
    """
    Run all five analysis engines on the submitted AI response and
    persist the result. Returns the full trust report.
    """
    engine_results = _run_engines(payload.response, payload.prompt)
    result = compose(engine_results, response_text=payload.response, prompt_text=payload.prompt)

    analysis = crud.create_analysis(
        db,
        prompt=payload.prompt,
        response=payload.response,
        result=result,
    )

    return AnalyzeResponse(
        id=analysis.id,
        trust_score=result["trust_score"],
        hallucination_risk=result["hallucination_risk"],
        bias_flags=result["bias_flags"],
        confidence_score=result["confidence_score"],
        summary=result["summary"],
        scores=result["scores"],
        trust_report=result["trust_report"],
        trust_engine=result["trust_engine"],
        created_at=analysis.created_at,
    )
