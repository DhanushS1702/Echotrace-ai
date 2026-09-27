import json
from sqlalchemy.orm import Session
from . import models


# ── Create ─────────────────────────────────────────────────────────────────────

def create_analysis(db: Session, *, prompt: str, response: str, result: dict) -> models.Analysis:
    """Persist a completed analysis and all its child scores/flags."""
    try:
        analysis = models.Analysis(
            prompt=prompt,
            response=response,
            trust_score=result["trust_score"],
            confidence_score=result["confidence_score"],
            hallucination_risk=result["hallucination_risk"],
            summary=result["summary"],
            recommendations=json.dumps(result.get("trust_engine", {}).get("recommendations", [])),
        )
        db.add(analysis)
        db.flush()  # populate analysis.id before adding children

        for metric, data in result.get("scores", {}).items():
            db.add(models.Score(
                analysis_id=analysis.id,
                metric=metric,
                score=data["score"],
                explanation=data["explanation"],
            ))

        for flag in result.get("bias_flags", []):
            db.add(models.BiasFlag(analysis_id=analysis.id, flag=flag))

        db.commit()
        db.refresh(analysis)
        return analysis
    except Exception as e:
        db.rollback()
        print(f"[CRUD Error in create_analysis]: {e}")
        raise e



# ── Read ───────────────────────────────────────────────────────────────────────

def get_analysis(db: Session, analysis_id: str) -> models.Analysis | None:
    return db.get(models.Analysis, analysis_id)


def list_analyses(db: Session, *, page: int = 1, limit: int = 20) -> tuple[int, list[models.Analysis]]:
    offset = (page - 1) * limit
    total  = db.query(models.Analysis).count()
    items  = (
        db.query(models.Analysis)
        .order_by(models.Analysis.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return total, items


# ── Delete ─────────────────────────────────────────────────────────────────────

def delete_analysis(db: Session, analysis_id: str) -> bool:
    obj = db.get(models.Analysis, analysis_id)
    if obj is None:
        return False
    db.delete(obj)
    db.commit()
    return True
