import io


def test_reviews_filtering_and_pagination(client):
    csv_content = (
        b"product_name,rating,review_text,review_date\n"
        b"Phone Case,5.0,Fantastic protection and sleek look,2024-01-01\n"
        b"Phone Case,1.0,Broke immediately upon putting it on,2024-01-02\n"
        b"Screen Protector,4.0,Easy installation no bubbles,2024-01-03\n"
        b"Screen Protector,2.0,Scratched very easily,2024-01-04\n"
    )
    client.post(
        "/api/uploads/import",
        files={"file": ("items.csv", io.BytesIO(csv_content), "text/csv")},
    )

    # 1. Total check
    res_all = client.get("/api/reviews")
    assert res_all.status_code == 200
    assert res_all.json()["total"] == 4

    # 2. Filter by rating = 5.0
    res_rating = client.get("/api/reviews?rating=5.0")
    assert res_rating.json()["total"] == 1
    assert res_rating.json()["items"][0]["rating"] == 5.0

    # 3. Filter by sentiment = Positive
    res_pos = client.get("/api/reviews?sentiment=Positive")
    assert res_pos.status_code == 200
    assert len(res_pos.json()["items"]) >= 1

    # 4. Search query
    res_search = client.get("/api/reviews?search=bubbles")
    assert res_search.json()["total"] == 1
    assert "bubbles" in res_search.json()["items"][0]["review_text"]

    # 5. Pagination
    res_page = client.get("/api/reviews?page=1&page_size=2")
    data_page = res_page.json()
    assert len(data_page["items"]) == 2
    assert data_page["page"] == 1
    assert data_page["total_pages"] == 2


def test_products_endpoint(client):
    csv_content = (
        b"product_name,rating,review_text\n"
        b"Gadget A,5.0,Excellent\n"
        b"Gadget A,4.0,Very good\n"
        b"Gadget B,2.0,Disappointing\n"
    )
    client.post(
        "/api/uploads/import",
        files={"file": ("gadgets.csv", io.BytesIO(csv_content), "text/csv")},
    )

    res = client.get("/api/products")
    assert res.status_code == 200
    products = res.json()
    assert len(products) == 2

    prod_a = next(p for p in products if p["name"] == "Gadget A")
    assert prod_a["review_count"] == 2
    assert prod_a["average_rating"] == 4.5

    prod_b = next(p for p in products if p["name"] == "Gadget B")
    assert prod_b["review_count"] == 1
    assert prod_b["average_rating"] == 2.0
