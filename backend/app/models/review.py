from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    external_id = Column(String(100), nullable=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    
    rating = Column(Float, nullable=False, index=True)
    review_title = Column(String(500), nullable=True)
    review_text = Column(Text, nullable=False)
    review_date = Column(Date, nullable=True, index=True)
    
    sentiment_label = Column(String(20), nullable=False, index=True)  # Positive, Neutral, Negative
    sentiment_score = Column(Float, nullable=False)  # VADER compound score (-1.0 to 1.0)
    
    reviewer_name = Column(String(255), nullable=True)
    verified_purchase = Column(Boolean, nullable=True)
    
    # Content hash or fingerprint for duplicate review detection
    content_hash = Column(String(64), nullable=True, index=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    product = relationship("Product", back_populates="reviews")

    __table_args__ = (
        Index("ix_reviews_product_rating", "product_id", "rating"),
        Index("ix_reviews_sentiment_date", "sentiment_label", "review_date"),
    )
