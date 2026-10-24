import io


def test_empty_dataset_endpoints(client):
    # Dashboard summary on empty DB
    res_dash = client.get("/api/dashboard/summary")
    assert res_dash.status_code == 200
    dash = res_dash.json()
    assert dash["total_reviews"] == 0
    assert dash["average_rating"] == 0.0
    assert dash["data_quality_score"] == 100.0

    # Ratings on empty DB
    res_ratings = client.get("/api/analytics/ratings")
    assert res_ratings.status_code == 200
    assert res_ratings.json()["distribution"] == []

    # Sentiment on empty DB
    res_sentiment = client.get("/api/analytics/sentiment")
    assert res_sentiment.status_code == 200
    assert res_sentiment.json()["distribution"]["Positive"] == 0

    # Trends on empty DB
    res_trends = client.get("/api/analytics/trends")
    assert res_trends.status_code == 200
    assert res_trends.json()["points"] == []
    assert res_trends.json()["forecast_available"] is False

    # Data Quality on empty DB
    res_dq = client.get("/api/analytics/data-quality")
    assert res_dq.status_code == 200
    assert res_dq.json()["valid_rows"] == 0


def test_dashboard_and_analytics_populated(client):
    csv_content = (
        b"product_name,rating,review_text,review_date\n"
        b"Soundbar X,5.0,Clear dialogue and deep subwoofer,2024-01-01\n"
        b"Soundbar X,5.0,Best home theater soundbar,2024-01-02\n"
        b"Soundbar X,1.0,Stopped turning on after a week,2024-01-03\n"
        b"Soundbar X,4.0,Good build quality and remote,2024-01-04\n"
    )
    client.post(
        "/api/uploads/import",
        files={"file": ("soundbar.csv", io.BytesIO(csv_content), "text/csv")},
    )

    # Dashboard summary
    res_dash = client.get("/api/dashboard/summary")
    assert res_dash.status_code == 200
    dash = res_dash.json()
    assert dash["total_reviews"] == 4
    # (5 + 5 + 1 + 4) / 4 = 15 / 4 = 3.75
    assert dash["average_rating"] == 3.75
    assert dash["positive_sentiment_pct"] >= 50.0
    assert dash["total_products"] == 1

    # Ratings stats
    res_ratings = client.get("/api/analytics/ratings")
    assert res_ratings.status_code == 200
    ratings_data = res_ratings.json()
    assert ratings_data["overall_stats"]["mean"] == 3.75
    assert ratings_data["overall_stats"]["min"] == 1.0
    assert ratings_data["overall_stats"]["max"] == 5.0
    assert len(ratings_data["product_distributions"]) == 1

    # Sentiment analytics
    res_sentiment = client.get("/api/analytics/sentiment")
    assert res_sentiment.status_code == 200
    sentiment_data = res_sentiment.json()
    assert sentiment_data["distribution"]["Positive"] >= 2
    assert sentiment_data["distribution"]["Negative"] >= 1
    assert len(sentiment_data["sentiment_by_rating"]) == 5

    # Data Quality
    res_dq = client.get("/api/analytics/data-quality")
    assert res_dq.status_code == 200
    dq = res_dq.json()
    assert dq["valid_rows"] == 4
    assert dq["rejected_rows"] == 0
    assert dq["quality_score"] == 100.0
