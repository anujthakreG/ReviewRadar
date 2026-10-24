"""
Review Service
Encapsulates database operations for Reviews and Products.
"""

from typing import Optional, List, Dict, Any, Tuple
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from app.models.review import Review
from app.models.product import Product


class ReviewService:
    def __init__(self, db: Session):
        self.db = db

    def get_reviews(
        self,
        product_id: Optional[int] = None,
        product_name: Optional[str] = None,
        rating: Optional[float] = None,
        sentiment: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Queries reviews with filtering, text search, sorting, and pagination."""
        query = self.db.query(Review, Product.name.label("product_name")).join(
            Product, Review.product_id == Product.id
        )

        if product_id is not None:
            query = query.filter(Review.product_id == product_id)
        if product_name:
            query = query.filter(Product.name.ilike(f"%{product_name}%"))
        if rating is not None:
            query = query.filter(Review.rating == rating)
        if sentiment:
            query = query.filter(Review.sentiment_label.ilike(sentiment))
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Review.review_text.ilike(search_pattern))
                | (Review.review_title.ilike(search_pattern))
                | (Product.name.ilike(search_pattern))
            )
        if start_date:
            query = query.filter(Review.review_date >= start_date)
        if end_date:
            query = query.filter(Review.review_date <= end_date)

        total = query.count()

        # Sorting
        sort_column = getattr(Review, sort_by, Review.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))

        # Pagination
        offset = (page - 1) * page_size
        results = query.offset(offset).limit(page_size).all()

        items = []
        for review, prod_name in results:
            items.append({
                "id": review.id,
                "external_id": review.external_id,
                "product_id": review.product_id,
                "product_name": prod_name,
                "rating": review.rating,
                "review_title": review.review_title,
                "review_text": review.review_text,
                "review_date": review.review_date,
                "sentiment_label": review.sentiment_label,
                "sentiment_score": review.sentiment_score,
                "reviewer_name": review.reviewer_name,
                "verified_purchase": review.verified_purchase,
                "created_at": review.created_at,
            })

        return items, total

    def get_all_reviews_raw(self) -> List[Dict[str, Any]]:
        """Fetches all reviews for analytics calculation."""
        results = (
            self.db.query(Review, Product.name.label("product_name"))
            .join(Product, Review.product_id == Product.id)
            .all()
        )
        return [
            {
                "id": r.id,
                "product_id": r.product_id,
                "product_name": p_name,
                "rating": r.rating,
                "review_title": r.review_title,
                "review_text": r.review_text,
                "review_date": r.review_date,
                "sentiment_label": r.sentiment_label,
                "sentiment_score": r.sentiment_score,
                "verified_purchase": r.verified_purchase,
            }
            for r, p_name in results
        ]

    def get_products(self) -> List[Dict[str, Any]]:
        """Fetches list of products with review count and average rating."""
        results = (
            self.db.query(
                Product.id,
                Product.name,
                Product.external_id,
                Product.created_at,
                func.count(Review.id).label("review_count"),
                func.avg(Review.rating).label("average_rating"),
            )
            .outerjoin(Review, Product.id == Review.product_id)
            .group_by(Product.id)
            .order_by(desc("review_count"))
            .all()
        )

        return [
            {
                "id": r.id,
                "name": r.name,
                "external_id": r.external_id,
                "created_at": r.created_at,
                "review_count": r.review_count or 0,
                "average_rating": round(float(r.average_rating or 0.0), 2),
            }
            for r in results
        ]

    def clear_database(self) -> None:
        """Deletes all reviews, products, and import jobs."""
        from app.models.import_job import ImportJob
        self.db.query(Review).delete()
        self.db.query(Product).delete()
        self.db.query(ImportJob).delete()
        self.db.commit()
