"""
ReviewRadar Automated Insights Engine
Generates business insights, keyword frequency extraction for negative and positive reviews,
and transparent assessments of dataset reliability.
"""

from typing import List, Dict, Any
from collections import Counter
import re
import pandas as pd
import numpy as np


# Standard stopwords list to filter out common conversational English words
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't",
    "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he",
    "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
    "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's",
    "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
    "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll",
    "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs",
    "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
    "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll",
    "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while",
    "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're",
    "you've", "your", "yours", "yourself", "yourselves", "one", "two", "also", "just", "get", "got", "even", "use",
    "using", "really", "much", "well"
}


def extract_frequent_terms(texts: List[str], top_n: int = 10) -> List[Dict[str, Any]]:
    """Extracts top non-stopword unigrams from a list of review texts."""
    words = []
    for text in texts:
        if not text:
            continue
        # Tokenize alphabetic words of length >= 3
        tokens = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        for token in tokens:
            if token not in STOPWORDS:
                words.append(token)

    counts = Counter(words).most_common(top_n)
    return [{"word": word, "count": count} for word, count in counts]


def generate_insights(
    reviews: List[Dict[str, Any]],
    products: List[Dict[str, Any]],
    data_quality_stats: Dict[str, Any],
) -> Dict[str, Any]:
    """Generates structured, transparent insights from the loaded reviews and products."""
    total_reviews = len(reviews)
    insights: List[Dict[str, Any]] = []

    if total_reviews == 0:
        return {
            "insights": [
                {
                    "type": "benchmark",
                    "title": "Empty Dataset",
                    "detail": "No review records are currently imported. Upload a review file or load sample data to generate analytics.",
                    "calculation_basis": "Database query returned 0 records.",
                    "confidence": "High",
                }
            ],
            "common_negative_terms": [],
            "common_positive_terms": [],
            "reliability_assessment": {
                "sample_size": 0,
                "confidence_level": "None",
                "summary": "No data available.",
            },
        }

    # Confidence assessment based on sample size
    if total_reviews >= 50:
        overall_confidence = "High"
        reliability_desc = f"Solid statistical sample of {total_reviews} verified reviews across multiple products."
    elif total_reviews >= 15:
        overall_confidence = "Moderate"
        reliability_desc = f"Moderate sample size ({total_reviews} reviews). Sufficient for directional indicators, but variance may be higher for smaller subcategories."
    else:
        overall_confidence = "Limited Evidence"
        reliability_desc = f"Small sample size ({total_reviews} reviews). Insights should be treated as observational anecdotes rather than definitive generalizations."

    # Group reviews by product
    product_stats = {}
    for r in reviews:
        p_name = r["product_name"]
        if p_name not in product_stats:
            product_stats[p_name] = {"ratings": [], "sentiments": [], "texts": []}
        product_stats[p_name]["ratings"].append(r["rating"])
        product_stats[p_name]["sentiments"].append(r["sentiment_label"])
        product_stats[p_name]["texts"].append(r["review_text"])

    # 1. Highest and Lowest Rated Products (using dynamic threshold)
    min_review_threshold = 2 if total_reviews >= 10 else 1
    qualified_products = [
        {
            "name": name,
            "avg_rating": round(float(np.mean(data["ratings"])), 2),
            "count": len(data["ratings"]),
            "negative_pct": round(
                (sum(1 for s in data["sentiments"] if s == "Negative") / len(data["sentiments"])) * 100, 1
            ),
        }
        for name, data in product_stats.items()
        if len(data["ratings"]) >= min_review_threshold
    ]

    if qualified_products:
        sorted_by_rating = sorted(qualified_products, key=lambda x: (x["avg_rating"], x["count"]), reverse=True)
        top_product = sorted_by_rating[0]
        lowest_product = sorted_by_rating[-1]

        insights.append({
            "type": "positive",
            "title": f"Top Performing Product: {top_product['name']}",
            "detail": f"{top_product['name']} leads with an average rating of {top_product['avg_rating']} / 5.0 across {top_product['count']} reviews.",
            "calculation_basis": f"Mean rating calculated over products with at least {min_review_threshold} reviews.",
            "confidence": "High" if top_product["count"] >= 5 else "Moderate",
        })

        if lowest_product["name"] != top_product["name"]:
            insights.append({
                "type": "warning",
                "title": f"Underperforming Product: {lowest_product['name']}",
                "detail": f"{lowest_product['name']} registered the lowest satisfaction with an average rating of {lowest_product['avg_rating']} / 5.0 ({lowest_product['negative_pct']}% negative sentiment).",
                "calculation_basis": f"Calculated as the lowest arithmetic mean among products with >= {min_review_threshold} reviews.",
                "confidence": "High" if lowest_product["count"] >= 5 else "Moderate",
            })

    # 2. Most common rating (mode)
    all_ratings = [r["rating"] for r in reviews]
    rating_counts = Counter(all_ratings)
    most_common_rating, count_mode = rating_counts.most_common(1)[0]
    pct_mode = round((count_mode / total_reviews) * 100, 1)

    insights.append({
        "type": "trend",
        "title": f"Dominant Rating: {most_common_rating} Stars ({pct_mode}%)",
        "detail": f"{count_mode} out of {total_reviews} reviews awarded exactly {most_common_rating} stars, representing the primary distribution cluster.",
        "calculation_basis": "Statistical mode of the rating distribution.",
        "confidence": overall_confidence,
    })

    # 3. Product with highest negative review proportion
    high_neg_candidates = [
        p for p in qualified_products if p["negative_pct"] > 0
    ]
    if high_neg_candidates:
        highest_neg = sorted(high_neg_candidates, key=lambda x: x["negative_pct"], reverse=True)[0]
        if highest_neg["negative_pct"] >= 20.0:
            insights.append({
                "type": "warning",
                "title": f"High Customer Friction: {highest_neg['name']}",
                "detail": f"{highest_neg['negative_pct']}% of customer reviews for {highest_neg['name']} expressed negative sentiment. Immediate quality assurance or UX review recommended.",
                "calculation_basis": "Proportion of VADER classified Negative reviews divided by total product reviews.",
                "confidence": "Moderate" if highest_neg["count"] >= 3 else "Limited Evidence",
            })

    # 4. Common keywords in Negative vs Positive Reviews
    negative_texts = [r["review_text"] for r in reviews if r.get("sentiment_label") == "Negative"]
    positive_texts = [r["review_text"] for r in reviews if r.get("sentiment_label") == "Positive"]

    common_neg_terms = extract_frequent_terms(negative_texts, top_n=8)
    common_pos_terms = extract_frequent_terms(positive_texts, top_n=8)

    if common_neg_terms:
        top_neg_words = ", ".join([f"'{item['word']}' ({item['count']})" for item in common_neg_terms[:4]])
        insights.append({
            "type": "warning",
            "title": "Recurring Pain Points in Negative Feedback",
            "detail": f"Frequent recurring terms in critical reviews: {top_neg_words}. These terms indicate specific points of customer friction.",
            "calculation_basis": "Frequency extraction of non-stopword tokens within Negative sentiment reviews.",
            "confidence": "Moderate" if len(negative_texts) >= 5 else "Limited Evidence",
        })

    # 5. Temporal Trend (if dates exist)
    dated_reviews = [r for r in reviews if r.get("review_date") is not None]
    if len(dated_reviews) >= 8:
        dated_reviews_sorted = sorted(dated_reviews, key=lambda x: x["review_date"])
        mid = len(dated_reviews_sorted) // 2
        first_half_avg = round(float(np.mean([r["rating"] for r in dated_reviews_sorted[:mid]])), 2)
        second_half_avg = round(float(np.mean([r["rating"] for r in dated_reviews_sorted[mid:]])), 2)
        delta = round(second_half_avg - first_half_avg, 2)

        if abs(delta) >= 0.2:
            direction = "improved" if delta > 0 else "declined"
            insights.append({
                "type": "positive" if delta > 0 else "warning",
                "title": f"Rating Trajectory {direction.capitalize()} by {abs(delta)} Stars",
                "detail": f"Average rating shifted from {first_half_avg} in earlier periods to {second_half_avg} in recent periods.",
                "calculation_basis": "Comparison of arithmetic mean ratings between the first half and second half of chronological reviews.",
                "confidence": "Moderate",
            })

    # 6. Data quality warning if any
    rejected_count = data_quality_stats.get("rejected_rows", 0)
    total_processed = data_quality_stats.get("total_rows_processed", 0)
    if rejected_count > 0 and total_processed > 0:
        rejected_pct = round((rejected_count / total_processed) * 100, 1)
        insights.append({
            "type": "benchmark",
            "title": f"Data Cleansing Notice: {rejected_pct}% of Rows Handled",
            "detail": f"{rejected_count} problematic rows (duplicates, out-of-scale ratings, or empty text) were flagged and handled during ingestion.",
            "calculation_basis": "Data cleaning pipeline rejection and sanitization counters.",
            "confidence": "High",
        })

    return {
        "insights": insights,
        "common_negative_terms": common_neg_terms,
        "common_positive_terms": common_pos_terms,
        "reliability_assessment": {
            "sample_size": total_reviews,
            "confidence_level": overall_confidence,
            "summary": reliability_desc,
        },
    }
