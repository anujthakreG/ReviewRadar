from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.api.dependencies import DbSession
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import (
    DashboardSummary,
    RatingsAnalyticsResponse,
    SentimentAnalyticsResponse,
    TrendsAnalyticsResponse,
    DataQualityResponse,
)

router = APIRouter(tags=["Analytics"])


@router.get("/dashboard/summary", response_model=DashboardSummary, summary="Dashboard KPIs and distribution overview")
def get_dashboard_summary(db: Session = DbSession):
    service = AnalyticsService(db)
    return service.get_dashboard_summary()


@router.get("/analytics/ratings", response_model=RatingsAnalyticsResponse, summary="Rating distribution and statistical summary")
def get_ratings_analytics(db: Session = DbSession):
    service = AnalyticsService(db)
    return service.get_ratings_analytics()


@router.get("/analytics/sentiment", response_model=SentimentAnalyticsResponse, summary="Sentiment breakdown and cross-tabs")
def get_sentiment_analytics(db: Session = DbSession):
    service = AnalyticsService(db)
    return service.get_sentiment_analytics()


@router.get("/analytics/trends", response_model=TrendsAnalyticsResponse, summary="Time-series trends and moving averages")
def get_trends_analytics(db: Session = DbSession):
    service = AnalyticsService(db)
    return service.get_trends_analytics()


@router.get("/analytics/data-quality", response_model=DataQualityResponse, summary="Data quality and hygiene audit report")
def get_data_quality_report(db: Session = DbSession):
    service = AnalyticsService(db)
    return service.get_data_quality_report()
