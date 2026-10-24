from typing import Optional
from datetime import date
from fastapi import APIRouter, Query
from sqlalchemy.orm import Session

from app.api.dependencies import DbSession
from app.services.review_service import ReviewService
from app.schemas.review import PaginatedReviewsResponse

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("", response_model=PaginatedReviewsResponse, summary="Get paginated and filtered reviews")
def get_reviews(
    product_id: Optional[int] = Query(None, description="Filter by internal product ID"),
    product_name: Optional[str] = Query(None, description="Filter by product name substring"),
    rating: Optional[float] = Query(None, description="Filter by exact rating"),
    sentiment: Optional[str] = Query(None, description="Filter by sentiment (Positive, Neutral, Negative)"),
    search: Optional[str] = Query(None, description="Search query across review text, title, and product name"),
    start_date: Optional[date] = Query(None, description="Filter reviews on or after this date"),
    end_date: Optional[date] = Query(None, description="Filter reviews on or before this date"),
    sort_by: str = Query("created_at", description="Field to sort by (created_at, review_date, rating, sentiment_score)"),
    sort_order: str = Query("desc", description="Sort direction ('asc' or 'desc')"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = DbSession,
):
    service = ReviewService(db)
    items, total = service.get_reviews(
        product_id=product_id,
        product_name=product_name,
        rating=rating,
        sentiment=sentiment,
        search=search,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
