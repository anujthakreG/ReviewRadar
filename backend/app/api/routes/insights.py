from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.api.dependencies import DbSession
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import InsightsResponse

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("", response_model=InsightsResponse, summary="Automated business insights and keyword analysis")
def get_insights(db: Session = DbSession):
    service = AnalyticsService(db)
    return service.get_insights()
