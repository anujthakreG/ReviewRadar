from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class PreviewResponse(BaseModel):
    filename: str
    total_rows_detected: int
    detected_columns: List[str]
    sample_rows: List[Dict[str, Any]]
    suggested_mapping: Dict[str, Optional[str]]
    preliminary_quality: Dict[str, Any]


class ColumnMapping(BaseModel):
    product_name: Optional[str] = "product_name"
    rating: Optional[str] = "rating"
    review_title: Optional[str] = "review_title"
    review_text: Optional[str] = "review_text"
    review_date: Optional[str] = "review_date"
    reviewer_name: Optional[str] = "reviewer_name"
    verified_purchase: Optional[str] = "verified_purchase"
    review_id: Optional[str] = "review_id"
    product_id: Optional[str] = "product_id"


class ImportSummary(BaseModel):
    job_id: int
    filename: str
    rows_processed: int
    rows_imported: int
    rows_rejected: int
    rows_duplicate: int
    status: str
    issues_summary: Dict[str, int]
    rejected_rows_sample: List[Dict[str, Any]] = []
