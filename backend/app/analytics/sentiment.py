"""
ReviewRadar Sentiment Analysis Engine
Uses VADER (Valence Aware Dictionary and sEntiment Reasoner) to compute sentiment polarity
and compound scores for product review texts.
"""

from typing import Dict, Any
import re
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Initialize VADER analyzer singleton
_analyzer = SentimentIntensityAnalyzer()

# Standard VADER compound score classification thresholds
# Positive: compound score >= 0.05
# Negative: compound score <= -0.05
# Neutral: -0.05 < compound score < 0.05
POSITIVE_THRESHOLD = 0.05
NEGATIVE_THRESHOLD = -0.05

METHODOLOGY_NOTE = (
    "Sentiment is analyzed using VADER (Valence Aware Dictionary and sEntiment Reasoner), "
    "a rule-based sentiment analysis tool specifically tuned for social and consumer review texts. "
    "Predictions are algorithmic approximations and should not be treated as absolute ground truth. "
    "Limitations include: difficulty detecting sarcasm or ironic humor, vulnerability to domain-specific jargon, "
    "and lower accuracy on non-English phrases or reviews containing mixed pros and cons."
)


def clean_text_for_sentiment(text: Any) -> str:
    """Preprocesses text for sentiment scoring while retaining punctuation that influences sentiment."""
    if text is None or not isinstance(text, str):
        return ""
    # Strip excessive whitespace
    cleaned = re.sub(r"\s+", " ", text).strip()
    return cleaned


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyzes sentiment of the input text.
    Returns:
        dict with keys:
            - label: 'Positive', 'Neutral', or 'Negative'
            - score: compound score between -1.0 and 1.0
            - pos: positive proportion
            - neu: neutral proportion
            - neg: negative proportion
    """
    cleaned = clean_text_for_sentiment(text)
    if not cleaned:
        return {
            "label": "Neutral",
            "score": 0.0,
            "compound": 0.0,
            "pos": 0.0,
            "neu": 1.0,
            "neg": 0.0,
        }

    scores = _analyzer.polarity_scores(cleaned)
    compound = round(scores["compound"], 4)

    if compound >= POSITIVE_THRESHOLD:
        label = "Positive"
    elif compound <= NEGATIVE_THRESHOLD:
        label = "Negative"
    else:
        label = "Neutral"

    return {
        "label": label,
        "score": compound,
        "compound": compound,
        "pos": round(scores["pos"], 4),
        "neu": round(scores["neu"], 4),
        "neg": round(scores["neg"], 4),
    }
