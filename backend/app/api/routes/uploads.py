import json
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import DbSession
from app.services.import_service import ImportService
from app.schemas.upload import PreviewResponse, ImportSummary
from app.core.config import settings

router = APIRouter(prefix="/uploads", tags=["Uploads"])

ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls", "json"}


def validate_file(file: UploadFile) -> str:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a filename.",
        )
    ext = file.filename.lower().split(".")[-1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '.{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    return ext


@router.post("/preview", response_model=PreviewResponse, summary="Preview uploaded review file")
async def preview_upload(
    file: UploadFile = File(...),
    db: Session = DbSession,
):
    validate_file(file)
    contents = await file.read()

    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB",
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is completely empty.",
        )

    service = ImportService(db)
    try:
        preview_data = service.generate_preview(contents, file.filename)
        return preview_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse and preview file: {str(e)}",
        )


@router.post("/import", response_model=ImportSummary, summary="Import and clean review dataset")
async def import_reviews(
    file: UploadFile = File(...),
    column_mapping: Optional[str] = Form(None),
    rating_scale_min: float = Form(1.0),
    rating_scale_max: float = Form(5.0),
    db: Session = DbSession,
):
    validate_file(file)
    contents = await file.read()

    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds maximum allowed size.",
        )

    mapping_dict = None
    if column_mapping:
        try:
            mapping_dict = json.loads(column_mapping)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON format provided for column_mapping.",
            )

    if rating_scale_min >= rating_scale_max:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid rating scale: minimum ({rating_scale_min}) must be less than maximum ({rating_scale_max}).",
        )

    service = ImportService(db)
    try:
        summary = service.execute_import(
            contents=contents,
            filename=file.filename,
            column_mapping=mapping_dict,
            rating_scale_min=rating_scale_min,
            rating_scale_max=rating_scale_max,
        )
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Import failed: {str(e)}",
        )
