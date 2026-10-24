from app.analytics.sentiment import analyze_sentiment, clean_text_for_sentiment


def test_positive_sentiment():
    res = analyze_sentiment("Absolutely amazing sound quality and exceptionally comfortable earcups!")
    assert res["label"] == "Positive"
    assert res["score"] > 0.05
    assert res["pos"] > 0


def test_negative_sentiment():
    res = analyze_sentiment("Terrible product. It broke after two days and customer support refused to help.")
    assert res["label"] == "Negative"
    assert res["score"] < -0.05
    assert res["neg"] > 0


def test_neutral_sentiment():
    res = analyze_sentiment("The package arrived on Tuesday at 4 PM in a brown cardboard box.")
    assert res["label"] == "Neutral"
    assert -0.05 <= res["score"] <= 0.05


def test_empty_and_whitespace_sentiment():
    res_empty = analyze_sentiment("")
    assert res_empty["label"] == "Neutral"
    assert res_empty["score"] == 0.0

    res_spaces = analyze_sentiment("     \n\t   ")
    assert res_spaces["label"] == "Neutral"
    assert res_spaces["score"] == 0.0

    res_none = analyze_sentiment(None)
    assert res_none["label"] == "Neutral"
    assert res_none["score"] == 0.0


def test_clean_text():
    assert clean_text_for_sentiment("  Extra   spaces  \n\n here  ") == "Extra spaces here"
    assert clean_text_for_sentiment(None) == ""
