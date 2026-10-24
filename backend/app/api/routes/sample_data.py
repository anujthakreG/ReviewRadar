import os
from fastapi import APIRouter, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.api.dependencies import DbSession
from app.services.import_service import ImportService
from app.services.review_service import ReviewService
from app.schemas.upload import ImportSummary

router = APIRouter(tags=["Sample Data & Database Management"])

SAMPLE_CSV_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "sample_reviews.csv")
)


@router.post("/sample-data/load", response_model=ImportSummary, summary="Load synthetic sample dataset")
def load_sample_dataset(db: Session = DbSession):
    if not os.path.exists(SAMPLE_CSV_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample CSV file not found at {SAMPLE_CSV_PATH}",
        )

    with open(SAMPLE_CSV_PATH, "rb") as f:
        contents = f.read()

    import_service = ImportService(db)
    summary = import_service.execute_import(
        contents=contents,
        filename="sample_reviews.csv",
        rating_scale_min=1.0,
        rating_scale_max=5.0,
    )
    return summary


@router.get("/sample-data/download", summary="Download sample review CSV template")
def download_sample_csv():
    if not os.path.exists(SAMPLE_CSV_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample reviews CSV is not available on disk.",
        )

    with open(SAMPLE_CSV_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sample_reviews.csv"},
    )


@router.post("/database/reset", summary="Clear all imported reviews and products")
def reset_database(db: Session = DbSession):
    service = ReviewService(db)
    service.clear_database()
    return {"status": "success", "message": "Database successfully reset to clean state."}
