import io


def test_insights_generation(client):
    csv_content = (
        b"product_name,rating,review_text,review_date\n"
        b"Coffee Maker,5.0,Excellent rich crema and fast heating,2024-01-01\n"
        b"Coffee Maker,5.0,Delicious coffee every morning,2024-01-02\n"
        b"Coffee Maker,4.0,Solid machine,2024-01-03\n"
        b"Blender,1.0,Motor overheated and smoked on day one,2024-01-04\n"
        b"Blender,1.0,Terrible blades dull immediately,2024-01-05\n"
    )
    client.post(
        "/api/uploads/import",
        files={"file": ("kitchen.csv", io.BytesIO(csv_content), "text/csv")},
    )

    res = client.get("/api/insights")
    assert res.status_code == 200
    data = res.json()
    assert len(data["insights"]) > 0

    titles = [item["title"] for item in data["insights"]]
    assert any("Coffee Maker" in t for t in titles)
    assert any("Blender" in t for t in titles)

    assert "common_negative_terms" in data
    assert "reliability_assessment" in data
    assert data["reliability_assessment"]["sample_size"] == 5
