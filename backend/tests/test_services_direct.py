import io
import pytest
from app.services.import_service import ImportService
from app.services.review_service import ReviewService
from app.services.analytics_service import AnalyticsService


def test_import_and_analytics_services_direct(db_session):
    import_service = ImportService(db_session)
    review_service = ReviewService(db_session)
    analytics_service = AnalyticsService(db_session)

    csv_content = (
        b"product_name,rating,review_title,review_text,review_date,reviewer_name\n"
        b"Direct Test Pro,5.0,Superb quality,Amazing sound and battery life,2024-01-10,Alice\n"
        b"Direct Test Pro,2.0,Flimsy,Broke after two days of usage,2024-01-12,Bob\n"
        b"Direct Test Pro,5.0,Superb quality,Amazing sound and battery life,2024-01-10,Alice\n"  # Duplicate
        b"Direct Test Pro,9.0,Invalid,Scale out of bounds,2024-01-13,Charlie\n"  # Invalid rating
    )

    summary = import_service.execute_import(
        contents=csv_content,
        filename="test.csv",
        rating_scale_min=1.0,
        rating_scale_max=5.0,
    )

    assert summary["rows_processed"] == 4
    assert summary["rows_imported"] == 2
    assert summary["rows_rejected"] == 2
    assert summary["rows_duplicate"] == 1

    # Check reviews retrieved via ReviewService
    items, total = review_service.get_reviews()
    assert total == 2
    assert len(items) == 2

    # Check analytics service
    dash = analytics_service.get_dashboard_summary()
    assert dash["total_reviews"] == 2
    assert dash["average_rating"] == 3.5
    assert dash["positive_sentiment_pct"] == 50.0
    assert dash["negative_sentiment_pct"] == 50.0

    # Check ratings analytics
    ratings = analytics_service.get_ratings_analytics()
    assert len(ratings["distribution"]) == 5
    assert ratings["overall_stats"]["mean"] == 3.5

    # Check data quality report
    dq = analytics_service.get_data_quality_report()
    assert dq["valid_rows"] == 2
    assert dq["rejected_rows"] == 2
    assert 0 < dq["quality_score"] < 100
