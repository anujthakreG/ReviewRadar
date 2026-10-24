from typing import List
from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.api.dependencies import DbSession
from app.services.review_service import ReviewService
from app.schemas.product import ProductOut

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[ProductOut], summary="List all products with review statistics")
def list_products(db: Session = DbSession):
    service = ReviewService(db)
    return service.get_products()
