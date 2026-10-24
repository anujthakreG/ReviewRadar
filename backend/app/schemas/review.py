from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class ReviewBase(BaseModel):
    product_name: str
    rating: float = Field(..., ge=1.0, le=5.0)
    review_title: Optional[str] = None
    review_text: str
    review_date: Optional[date] = None
    reviewer_name: Optional[str] = None
    verified_purchase: Optional[bool] = None
    external_id: Optional[str] = None


class ReviewCreate(ReviewBase):
    pass


class ReviewOut(BaseModel):
    id: int
    external_id: Optional[str] = None
    product_id: int
    product_name: str
    rating: float
    review_title: Optional[str] = None
    review_text: str
    review_date: Optional[date] = None
    sentiment_label: str
    sentiment_score: float
    reviewer_name: Optional[str] = None
    verified_purchase: Optional[bool] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedReviewsResponse(BaseModel):
    items: List[ReviewOut]
    total: int
    page: int
    page_size: int
    total_pages: int
