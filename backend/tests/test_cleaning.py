import pandas as pd
from app.analytics.cleaner import DataCleaningPipeline, auto_detect_mapping
from app.analytics.quality import calculate_data_quality_score, generate_issue_explanations


def test_auto_detect_mapping():
    cols = ["item_name", "stars", "comments", "timestamp", "user"]
    mapping = auto_detect_mapping(cols)
    assert mapping["product_name"] == "item_name"
    assert mapping["rating"] == "stars"
    assert mapping["review_text"] == "comments"
    assert mapping["review_date"] == "timestamp"
    assert mapping["reviewer_name"] == "user"


def test_data_cleaning_pipeline_valid_and_invalid_records():
    raw_data = [
        # Valid row
        {
            "product_name": "AuraSound Headphones",
            "rating": "5.0",
            "review_title": "Great sound",
            "review_text": "Love the bass and comfort.",
            "review_date": "2024-01-15",
            "reviewer_name": "Alice",
            "verified_purchase": "True",
            "review_id": "R01",
        },
        # Missing rating
        {
            "product_name": "AuraSound Headphones",
            "rating": "",
            "review_title": "Missing rating",
            "review_text": "Good headphones but rating is blank.",
            "review_date": "2024-01-16",
            "reviewer_name": "Bob",
            "verified_purchase": "True",
            "review_id": "R02",
        },
        # Rating out of scale (> 5)
        {
            "product_name": "AuraSound Headphones",
            "rating": "8.5",
            "review_title": "Out of scale",
            "review_text": "Rated 8.5 on a 5-star scale.",
            "review_date": "2024-01-17",
            "reviewer_name": "Charlie",
            "verified_purchase": "False",
            "review_id": "R03",
        },
        # Missing review text
        {
            "product_name": "AuraSound Headphones",
            "rating": "4.0",
            "review_title": "No text",
            "review_text": "   ",
            "review_date": "2024-01-18",
            "reviewer_name": "David",
            "verified_purchase": "True",
            "review_id": "R04",
        },
        # Duplicate of row 1 (same review_id R01)
        {
            "product_name": "AuraSound Headphones",
            "rating": "5.0",
            "review_title": "Great sound",
            "review_text": "Love the bass and comfort.",
            "review_date": "2024-01-15",
            "reviewer_name": "Alice",
            "verified_purchase": "True",
            "review_id": "R01",
        },
    ]

    df = pd.DataFrame(raw_data)
    pipeline = DataCleaningPipeline(rating_min=1.0, rating_max=5.0)
    valid_records, report = pipeline.clean_dataframe(df)

    stats = report["stats"]
    assert stats["total_rows_processed"] == 5
    assert stats["valid_rows"] == 1
    assert stats["rejected_rows"] == 4
    assert stats["missing_ratings"] == 1
    assert stats["invalid_ratings"] == 1
    assert stats["missing_text"] == 1
    assert stats["duplicate_rows"] == 1

    assert len(valid_records) == 1
    assert valid_records[0]["product_name"] == "AuraSound Headphones"
    assert valid_records[0]["rating"] == 5.0


def test_data_quality_score_calculation():
    # 100% valid
    perfect_score = calculate_data_quality_score(
        total_processed=10,
        valid_rows=10,
        rejected_rows=0,
        duplicate_rows=0,
        missing_ratings=0,
        missing_text=0,
        invalid_ratings=0,
        invalid_dates=0,
    )
    assert perfect_score == 100.0

    # Half rejected
    half_score = calculate_data_quality_score(
        total_processed=10,
        valid_rows=5,
        rejected_rows=5,
        duplicate_rows=2,
        missing_ratings=2,
        missing_text=1,
        invalid_ratings=0,
        invalid_dates=0,
    )
    assert 0.0 <= half_score < 80.0


def test_generate_issue_explanations():
    stats = {
        "duplicate_rows": 2,
        "missing_ratings": 1,
        "missing_text": 1,
        "invalid_ratings": 1,
        "invalid_dates": 0,
    }
    explanations = generate_issue_explanations(stats)
    types = [e["issue_type"] for e in explanations]
    assert "Duplicate Reviews Detected" in types
    assert "Missing Star Ratings" in types
    assert "Blank or Whitespace Review Text" in types
    assert "Ratings Outside Valid Scale Range" in types
