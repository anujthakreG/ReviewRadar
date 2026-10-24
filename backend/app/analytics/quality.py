"""
ReviewRadar Data Quality Assessment Engine
Calculates transparent data quality scores, tracks before-and-after cleaning metrics,
and generates plain-language explanations of dataset health.
"""

from typing import Dict, Any, List


def calculate_data_quality_score(
    total_processed: int,
    valid_rows: int,
    rejected_rows: int,
    duplicate_rows: int,
    missing_ratings: int,
    missing_text: int,
    invalid_ratings: int,
    invalid_dates: int,
) -> float:
    """
    Computes a transparent 0-100 data quality score based on integrity criteria:
    - Validity Ratio (50% weight)
    - Completeness Ratio (25% weight)
    - Uniqueness Ratio (15% weight)
    - Consistency Ratio (10% weight)
    """
    if total_processed <= 0:
        return 100.0

    validity_ratio = valid_rows / total_processed
    completeness_penalty = min(1.0, (missing_ratings + missing_text) / total_processed)
    duplicate_penalty = min(1.0, duplicate_rows / total_processed)
    consistency_penalty = min(1.0, (invalid_ratings + invalid_dates) / total_processed)

    score = (
        (validity_ratio * 50.0)
        + ((1.0 - completeness_penalty) * 25.0)
        + ((1.0 - duplicate_penalty) * 15.0)
        + ((1.0 - consistency_penalty) * 10.0)
    )
    return round(max(0.0, min(100.0, score)), 1)


def generate_issue_explanations(stats: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generates plain language explanations for observed data quality anomalies."""
    explanations = []

    if stats.get("duplicate_rows", 0) > 0:
        explanations.append({
            "issue_type": "Duplicate Reviews Detected",
            "count": stats["duplicate_rows"],
            "impact": "Skewed product rating averages and inflated review volumes.",
            "rule_applied": (
                "Identified via identical (product_name, rating, review_text) content hash or "
                "reused review_id. Subsequent duplicate entries are safely rejected to prevent double counting."
            ),
        })

    if stats.get("missing_ratings", 0) > 0:
        explanations.append({
            "issue_type": "Missing Star Ratings",
            "count": stats["missing_ratings"],
            "impact": "Cannot calculate accurate product rating distributions without arbitrary imputation.",
            "rule_applied": (
                "Per system guidelines, missing ratings are NOT arbitrarily filled with default values. "
                "Rows with absent ratings are flagged and excluded from the database."
            ),
        })

    if stats.get("missing_text", 0) > 0:
        explanations.append({
            "issue_type": "Blank or Whitespace Review Text",
            "count": stats["missing_text"],
            "impact": "Sentiment analysis requires non-empty textual content to extract polarity.",
            "rule_applied": (
                "Text fields containing solely whitespace or null values are flagged. "
                "These records cannot undergo natural language processing and are excluded."
            ),
        })

    if stats.get("invalid_ratings", 0) > 0:
        explanations.append({
            "issue_type": "Ratings Outside Valid Scale Range",
            "count": stats["invalid_ratings"],
            "impact": "Ratings exceeding allowed bounds (e.g. 9 on a 1-5 scale) distort analytics metrics.",
            "rule_applied": (
                "Configured rating boundary check strictly enforced. Values outside [min, max] "
                "or unparseable non-numeric strings are safely rejected."
            ),
        })

    if stats.get("invalid_dates", 0) > 0:
        explanations.append({
            "issue_type": "Unparseable or Inconsistent Dates",
            "count": stats["invalid_dates"],
            "impact": "Reviews cannot be placed onto a chronological timeline.",
            "rule_applied": (
                "Review records with valid text and ratings are retained for product analytics, "
                "but nullified dates are excluded from time-series and trend calculations."
            ),
        })

    if not explanations:
        explanations.append({
            "issue_type": "All Checks Passed",
            "count": 0,
            "impact": "No data hygiene issues encountered.",
            "rule_applied": "All imported records conform to schema and validation rules.",
        })

    return explanations
