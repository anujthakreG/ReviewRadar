import io


def test_preview_csv_endpoint(client):
    csv_content = b"product_name,rating,review_text\nWidget A,5,Great widget\nWidget B,3,Average widget\n"
    response = client.post(
        "/api/uploads/preview",
        files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.csv"
    assert data["total_rows_detected"] == 2
    assert "product_name" in data["detected_columns"]
    assert "rating" in data["detected_columns"]
    assert "review_text" in data["detected_columns"]
    assert len(data["sample_rows"]) == 2


def test_preview_unsupported_file_extension(client):
    response = client.post(
        "/api/uploads/preview",
        files={"file": ("malicious.exe", io.BytesIO(b"fake binary"), "application/octet-stream")},
    )
    assert response.status_code == 400
    assert "Unsupported file extension" in response.json()["detail"]


def test_preview_empty_file(client):
    response = client.post(
        "/api/uploads/preview",
        files={"file": ("empty.csv", io.BytesIO(b""), "text/csv")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_import_csv_endpoint(client):
    csv_content = (
        b"product_name,rating,review_title,review_text,review_date,reviewer_name\n"
        b"Laptop Stand,4.5,Ergonomic,Very solid aluminum construction,2024-01-10,Alex\n"
        b"Laptop Stand,2.0,Flimsy,Hinges slipped while holding my laptop,2024-01-12,Sam\n"
    )
    response = client.post(
        "/api/uploads/import",
        files={"file": ("stands.csv", io.BytesIO(csv_content), "text/csv")},
        data={"rating_scale_min": "1.0", "rating_scale_max": "5.0"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "stands.csv"
    assert data["rows_processed"] == 2
    assert data["rows_imported"] == 2
    assert data["rows_rejected"] == 0

    # Verify reviews were inserted
    rev_resp = client.get("/api/reviews")
    assert rev_resp.status_code == 200
    assert rev_resp.json()["total"] == 2


def test_import_with_duplicates_and_invalid_data(client):
    csv_content = (
        b"product,stars,body\n"
        b"Wireless Mouse,5,Smooth tracking and quiet clicks\n"
        b"Wireless Mouse,5,Smooth tracking and quiet clicks\n"  # Duplicate content
        b"Wireless Mouse,9,Impossible rating\n"  # Out of scale
        b"Wireless Mouse,,No rating provided\n"  # Missing rating
    )
    mapping = '{"product_name": "product", "rating": "stars", "review_text": "body"}'
    response = client.post(
        "/api/uploads/import",
        files={"file": ("mice.csv", io.BytesIO(csv_content), "text/csv")},
        data={"column_mapping": mapping, "rating_scale_min": "1.0", "rating_scale_max": "5.0"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["rows_processed"] == 4
    assert data["rows_imported"] == 1
    assert data["rows_rejected"] == 3
    assert data["rows_duplicate"] == 1
