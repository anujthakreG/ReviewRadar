def test_sample_data_loader_and_reset(client):
    # Load sample dataset
    res_load = client.post("/api/sample-data/load")
    assert res_load.status_code == 200
    data_load = res_load.json()
    assert data_load["rows_processed"] > 25
    assert data_load["rows_imported"] > 25
    assert data_load["rows_rejected"] > 0  # our sample intentionally has 4-5 flawed rows!

    # Check reviews populated
    res_revs = client.get("/api/reviews")
    assert res_revs.status_code == 200
    assert res_revs.json()["total"] == data_load["rows_imported"]

    # Download sample CSV
    res_dl = client.get("/api/sample-data/download")
    assert res_dl.status_code == 200
    assert "review_id,product_name" in res_dl.text

    # Reset database
    res_reset = client.post("/api/database/reset")
    assert res_reset.status_code == 200

    # Verify cleared
    res_after = client.get("/api/reviews")
    assert res_after.json()["total"] == 0
