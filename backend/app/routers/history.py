from fastapi import APIRouter, Depends, HTTPException, Query  # HTTPException used in delete
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import HistoryResponse, AnalysisSummary
from .. import crud

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=HistoryResponse)
def list_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Return a paginated list of past analyses (newest first)."""
    total, items = crud.list_analyses(db, page=page, limit=limit)
    return HistoryResponse(
        total=total,
        page=page,
        limit=limit,
        items=[AnalysisSummary.model_validate(item) for item in items],
    )


@router.delete("/{analysis_id}", status_code=204)
def delete_history_item(analysis_id: str, db: Session = Depends(get_db)):
    """Permanently delete a single analysis record and its scores."""
    deleted = crud.delete_analysis(db, analysis_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Analysis not found.")
