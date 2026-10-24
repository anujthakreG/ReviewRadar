from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.schemas.review import ReviewOut


class RatingCount(BaseModel):
    rating: float
    count: int
    percentage: float


class ProductRatingSummary(BaseModel):
    product_id: int
    product_name: str
    review_count: int
    average_rating: float
    min_rating: float
    q1: float
    median: float
    q3: float
    max_rating: float


class DashboardSummary(BaseModel):
    total_reviews: int
    average_rating: float
    positive_sentiment_pct: float
    neutral_sentiment_pct: float
    negative_sentiment_pct: float
    total_products: int
    data_quality_score: float
    rating_distribution: List[RatingCount]
    sentiment_breakdown: Dict[str, int]
    review_volume_trend: List[Dict[str, Any]]
    average_rating_trend: List[Dict[str, Any]]
    top_rated_products: List[Dict[str, Any]]
    lowest_rated_products: List[Dict[str, Any]]
    recent_reviews: List[ReviewOut]
    data_quality_summary: Dict[str, Any]


class RatingsAnalyticsResponse(BaseModel):
    distribution: List[RatingCount]
    overall_stats: Dict[str, Any]
    product_distributions: List[ProductRatingSummary]


class SentimentAnalyticsResponse(BaseModel):
    distribution: Dict[str, int]
    sentiment_by_rating: List[Dict[str, Any]]
    sentiment_by_product: List[Dict[str, Any]]
    methodology: Dict[str, Any]


class TrendPoint(BaseModel):
    date: str
    review_count: int
    average_rating: float
    sma_7: Optional[float] = None
    ema_7: Optional[float] = None
    is_forecast: bool = False


class TrendsAnalyticsResponse(BaseModel):
    points: List[TrendPoint]
    forecast_available: bool
    forecast_message: str
    summary: Dict[str, Any]


class IssueExplanation(BaseModel):
    issue_type: str
    count: int
    impact: str
    rule_applied: str


class DataQualityResponse(BaseModel):
    total_rows_processed: int
    valid_rows: int
    rejected_rows: int
    duplicate_rows: int
    missing_ratings: int
    missing_text: int
    invalid_ratings: int
    invalid_dates: int
    quality_score: float
    before_after_comparison: Dict[str, Any]
    issue_explanations: List[IssueExplanation]
    problematic_rows_sample: List[Dict[str, Any]]


class InsightItem(BaseModel):
    type: str  # positive, warning, trend, benchmark
    title: str
    detail: str
    calculation_basis: str
    confidence: str  # High, Moderate, Limited Evidence


class InsightsResponse(BaseModel):
    insights: List[InsightItem]
    common_negative_terms: List[Dict[str, Any]]
    common_positive_terms: List[Dict[str, Any]]
    reliability_assessment: Dict[str, Any]
