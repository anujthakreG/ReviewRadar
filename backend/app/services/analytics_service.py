"""
Analytics Service
Aggregates review records, generates statistical summaries, box-plot distributions,
data quality evaluations, and business insights.
"""

from typing import Dict, Any, List
import json
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.review import Review
from app.models.product import Product
from app.models.import_job import ImportJob
from app.services.review_service import ReviewService
from app.analytics.trends import calculate_trends
from app.analytics.insights import generate_insights
from app.analytics.quality import (
    calculate_data_quality_score,
    generate_issue_explanations,
)
from app.analytics.sentiment import METHODOLOGY_NOTE


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db
        self.review_service = ReviewService(db)

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Calculates comprehensive dashboard KPIs and initial chart distributions."""
        reviews = self.review_service.get_all_reviews_raw()
        products = self.review_service.get_products()
        total_reviews = len(reviews)

        if total_reviews == 0:
            return {
                "total_reviews": 0,
                "average_rating": 0.0,
                "positive_sentiment_pct": 0.0,
                "neutral_sentiment_pct": 0.0,
                "negative_sentiment_pct": 0.0,
                "total_products": 0,
                "data_quality_score": 100.0,
                "rating_distribution": [
                    {"rating": float(r), "count": 0, "percentage": 0.0} for r in range(1, 6)
                ],
                "sentiment_breakdown": {"Positive": 0, "Neutral": 0, "Negative": 0},
                "review_volume_trend": [],
                "average_rating_trend": [],
                "top_rated_products": [],
                "lowest_rated_products": [],
                "recent_reviews": [],
                "data_quality_summary": {
                    "total_processed": 0,
                    "valid_rows": 0,
                    "rejected_rows": 0,
                    "quality_score": 100.0,
                },
            }

        # Ratings
        ratings = [r["rating"] for r in reviews]
        avg_rating = round(float(np.mean(ratings)), 2)

        # Rating distribution (1 to 5)
        rating_counts_dict = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for r_val in ratings:
            bucket = int(round(r_val))
            if 1 <= bucket <= 5:
                rating_counts_dict[bucket] += 1

        rating_distribution = [
            {
                "rating": float(star),
                "count": count,
                "percentage": round((count / total_reviews) * 100, 1),
            }
            for star, count in sorted(rating_counts_dict.items())
        ]

        # Sentiment breakdown
        sentiment_counts = {"Positive": 0, "Neutral": 0, "Negative": 0}
        for r in reviews:
            label = r["sentiment_label"]
            sentiment_counts[label] = sentiment_counts.get(label, 0) + 1

        pos_pct = round((sentiment_counts["Positive"] / total_reviews) * 100, 1)
        neu_pct = round((sentiment_counts["Neutral"] / total_reviews) * 100, 1)
        neg_pct = round((sentiment_counts["Negative"] / total_reviews) * 100, 1)

        # Time series trends
        trends_res = calculate_trends(reviews)
        observed_points = [p for p in trends_res["points"] if not p.get("is_forecast")]

        volume_trend = [
            {"date": p["date"], "count": p["review_count"], "sma_7": p.get("sma_7")}
            for p in observed_points
        ]
        avg_rating_trend = [
            {"date": p["date"], "rating": p["average_rating"]}
            for p in observed_points
        ]

        # Product leaderboards
        top_rated = sorted(
            [p for p in products if p["review_count"] > 0],
            key=lambda x: (x["average_rating"], x["review_count"]),
            reverse=True,
        )[:5]

        lowest_rated = sorted(
            [p for p in products if p["review_count"] > 0],
            key=lambda x: (x["average_rating"], -x["review_count"]),
        )[:5]

        # Recent reviews
        recent_items, _ = self.review_service.get_reviews(page=1, page_size=5, sort_by="created_at", sort_order="desc")

        # Data quality stats from import jobs
        dq_stats = self._get_aggregate_import_stats()
        quality_score = calculate_data_quality_score(
            total_processed=dq_stats["total_rows_processed"] or total_reviews,
            valid_rows=dq_stats["valid_rows"] or total_reviews,
            rejected_rows=dq_stats["rejected_rows"],
            duplicate_rows=dq_stats["duplicate_rows"],
            missing_ratings=dq_stats["missing_ratings"],
            missing_text=dq_stats["missing_text"],
            invalid_ratings=dq_stats["invalid_ratings"],
            invalid_dates=dq_stats["invalid_dates"],
        )

        return {
            "total_reviews": total_reviews,
            "average_rating": avg_rating,
            "positive_sentiment_pct": pos_pct,
            "neutral_sentiment_pct": neu_pct,
            "negative_sentiment_pct": neg_pct,
            "total_products": len(products),
            "data_quality_score": quality_score,
            "rating_distribution": rating_distribution,
            "sentiment_breakdown": sentiment_counts,
            "review_volume_trend": volume_trend,
            "average_rating_trend": avg_rating_trend,
            "top_rated_products": top_rated,
            "lowest_rated_products": lowest_rated,
            "recent_reviews": recent_items,
            "data_quality_summary": {
                "total_processed": dq_stats["total_rows_processed"] or total_reviews,
                "valid_rows": dq_stats["valid_rows"] or total_reviews,
                "rejected_rows": dq_stats["rejected_rows"],
                "quality_score": quality_score,
            },
        }

    def get_ratings_analytics(self) -> Dict[str, Any]:
        """Computes statistical metrics (mean, median, mode, IQR) and box-plot values per product."""
        reviews = self.review_service.get_all_reviews_raw()
        total_reviews = len(reviews)

        if total_reviews == 0:
            return {
                "distribution": [],
                "overall_stats": {
                    "mean": 0.0,
                    "median": 0.0,
                    "mode": 0.0,
                    "std_dev": 0.0,
                    "min": 0.0,
                    "max": 0.0,
                    "q1": 0.0,
                    "q3": 0.0,
                    "iqr": 0.0,
                },
                "product_distributions": [],
            }

        ratings = np.array([r["rating"] for r in reviews])
        q1 = float(np.percentile(ratings, 25))
        median = float(np.median(ratings))
        q3 = float(np.percentile(ratings, 75))
        iqr = round(q3 - q1, 2)

        # Mode
        vals, counts = np.unique(ratings, return_counts=True)
        mode_val = float(vals[np.argmax(counts)])

        overall_stats = {
            "mean": round(float(np.mean(ratings)), 2),
            "median": round(median, 2),
            "mode": round(mode_val, 2),
            "std_dev": round(float(np.std(ratings)), 2),
            "min": round(float(np.min(ratings)), 2),
            "max": round(float(np.max(ratings)), 2),
            "q1": round(q1, 2),
            "q3": round(q3, 2),
            "iqr": iqr,
        }

        # Histogram distribution
        rating_counts_dict = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for r_val in ratings:
            bucket = int(round(r_val))
            if 1 <= bucket <= 5:
                rating_counts_dict[bucket] += 1

        distribution = [
            {
                "rating": float(star),
                "count": count,
                "percentage": round((count / total_reviews) * 100, 1),
            }
            for star, count in sorted(rating_counts_dict.items())
        ]

        # Per product box plot summary
        df = pd.DataFrame(reviews)
        product_distributions = []
        for p_name, group in df.groupby("product_name"):
            p_ratings = group["rating"].values
            prod_id = int(group["product_id"].iloc[0])
            p_q1 = float(np.percentile(p_ratings, 25))
            p_med = float(np.median(p_ratings))
            p_q3 = float(np.percentile(p_ratings, 75))

            product_distributions.append({
                "product_id": prod_id,
                "product_name": p_name,
                "review_count": len(p_ratings),
                "average_rating": round(float(np.mean(p_ratings)), 2),
                "min_rating": round(float(np.min(p_ratings)), 2),
                "q1": round(p_q1, 2),
                "median": round(p_med, 2),
                "q3": round(p_q3, 2),
                "max_rating": round(float(np.max(p_ratings)), 2),
            })

        product_distributions.sort(key=lambda x: x["average_rating"], reverse=True)

        return {
            "distribution": distribution,
            "overall_stats": overall_stats,
            "product_distributions": product_distributions,
        }

    def get_sentiment_analytics(self) -> Dict[str, Any]:
        """Computes sentiment breakdown overall, by rating star, and by product."""
        reviews = self.review_service.get_all_reviews_raw()
        total_reviews = len(reviews)

        if total_reviews == 0:
            return {
                "distribution": {"Positive": 0, "Neutral": 0, "Negative": 0},
                "sentiment_by_rating": [],
                "sentiment_by_product": [],
                "methodology": {
                    "model": "VADER (Valence Aware Dictionary and sEntiment Reasoner)",
                    "note": METHODOLOGY_NOTE,
                },
            }

        # Overall distribution
        distribution = {"Positive": 0, "Neutral": 0, "Negative": 0}
        for r in reviews:
            label = r["sentiment_label"]
            distribution[label] = distribution.get(label, 0) + 1

        df = pd.DataFrame(reviews)

        # Sentiment by rating
        sentiment_by_rating = []
        for star in range(1, 6):
            star_df = df[df["rating"].round() == star]
            star_total = len(star_df)
            pos_c = int((star_df["sentiment_label"] == "Positive").sum())
            neu_c = int((star_df["sentiment_label"] == "Neutral").sum())
            neg_c = int((star_df["sentiment_label"] == "Negative").sum())

            sentiment_by_rating.append({
                "rating": star,
                "total": star_total,
                "positive": pos_c,
                "neutral": neu_c,
                "negative": neg_c,
                "positive_pct": round((pos_c / star_total) * 100, 1) if star_total > 0 else 0.0,
                "negative_pct": round((neg_c / star_total) * 100, 1) if star_total > 0 else 0.0,
            })

        # Sentiment by product
        sentiment_by_product = []
        for p_name, group in df.groupby("product_name"):
            p_total = len(group)
            pos_c = int((group["sentiment_label"] == "Positive").sum())
            neu_c = int((group["sentiment_label"] == "Neutral").sum())
            neg_c = int((group["sentiment_label"] == "Negative").sum())

            sentiment_by_product.append({
                "product_name": p_name,
                "total": p_total,
                "positive": pos_c,
                "neutral": neu_c,
                "negative": neg_c,
                "positive_pct": round((pos_c / p_total) * 100, 1) if p_total > 0 else 0.0,
                "negative_pct": round((neg_c / p_total) * 100, 1) if p_total > 0 else 0.0,
            })

        sentiment_by_product.sort(key=lambda x: x["positive_pct"], reverse=True)

        return {
            "distribution": distribution,
            "sentiment_by_rating": sentiment_by_rating,
            "sentiment_by_product": sentiment_by_product,
            "methodology": {
                "model": "VADER (Valence Aware Dictionary and sEntiment Reasoner)",
                "note": METHODOLOGY_NOTE,
                "thresholds": {
                    "positive": "compound >= 0.05",
                    "neutral": "-0.05 < compound < 0.05",
                    "negative": "compound <= -0.05",
                },
            },
        }

    def get_trends_analytics(self) -> Dict[str, Any]:
        """Calculates time-series trends, moving averages, and optional forecasting."""
        reviews = self.review_service.get_all_reviews_raw()
        return calculate_trends(reviews)

    def get_data_quality_report(self) -> Dict[str, Any]:
        """Aggregates all historical import quality reports and problematic row samples."""
        reviews = self.review_service.get_all_reviews_raw()
        total_valid_in_db = len(reviews)

        dq_stats = self._get_aggregate_import_stats()
        total_processed = dq_stats["total_rows_processed"] or total_valid_in_db
        valid_rows = dq_stats["valid_rows"] or total_valid_in_db
        rejected_rows = dq_stats["rejected_rows"]

        score = calculate_data_quality_score(
            total_processed=total_processed,
            valid_rows=valid_rows,
            rejected_rows=rejected_rows,
            duplicate_rows=dq_stats["duplicate_rows"],
            missing_ratings=dq_stats["missing_ratings"],
            missing_text=dq_stats["missing_text"],
            invalid_ratings=dq_stats["invalid_ratings"],
            invalid_dates=dq_stats["invalid_dates"],
        )

        explanations = generate_issue_explanations(dq_stats)

        # Before / after cleaning comparison
        before_after = {
            "before": {
                "total_rows": total_processed,
                "data_integrity": round((valid_rows / total_processed) * 100, 1) if total_processed > 0 else 100.0,
                "unclean_or_problematic_rows": rejected_rows,
            },
            "after": {
                "clean_rows_in_database": total_valid_in_db,
                "data_integrity": 100.0 if total_valid_in_db > 0 else 0.0,
                "schema_conformity": "100% verified against ratings bounds and non-empty text",
            },
        }

        # Retrieve sample problematic rows from import jobs
        problematic_rows_sample = []
        jobs = self.db.query(ImportJob).order_by(ImportJob.uploaded_at.desc()).all()
        for job in jobs:
            if job.summary_details:
                try:
                    parsed_summary = json.loads(job.summary_details)
                    # Look for samples
                    samples = parsed_summary.get("rejected_rows_sample", [])
                    problematic_rows_sample.extend(samples)
                    if len(problematic_rows_sample) >= 20:
                        break
                except Exception:
                    pass

        return {
            "total_rows_processed": total_processed,
            "valid_rows": valid_rows,
            "rejected_rows": rejected_rows,
            "duplicate_rows": dq_stats["duplicate_rows"],
            "missing_ratings": dq_stats["missing_ratings"],
            "missing_text": dq_stats["missing_text"],
            "invalid_ratings": dq_stats["invalid_ratings"],
            "invalid_dates": dq_stats["invalid_dates"],
            "quality_score": score,
            "before_after_comparison": before_after,
            "issue_explanations": explanations,
            "problematic_rows_sample": problematic_rows_sample[:20],
        }

    def get_insights(self) -> Dict[str, Any]:
        """Generates business insights, keyword analysis, and dataset reliability evaluation."""
        reviews = self.review_service.get_all_reviews_raw()
        products = self.review_service.get_products()
        dq_stats = self._get_aggregate_import_stats()
        return generate_insights(reviews, products, dq_stats)

    def _get_aggregate_import_stats(self) -> Dict[str, int]:
        """Summarizes stats across all ImportJob logs."""
        jobs = self.db.query(ImportJob).all()
        stats = {
            "total_rows_processed": 0,
            "valid_rows": 0,
            "rejected_rows": 0,
            "duplicate_rows": 0,
            "missing_ratings": 0,
            "missing_text": 0,
            "missing_products": 0,
            "invalid_ratings": 0,
            "invalid_dates": 0,
        }

        for j in jobs:
            stats["total_rows_processed"] += j.rows_processed
            stats["valid_rows"] += j.rows_imported
            stats["rejected_rows"] += j.rows_rejected
            stats["duplicate_rows"] += j.rows_duplicate

            if j.summary_details:
                try:
                    parsed = json.loads(j.summary_details)
                    j_stats = parsed.get("stats", {})
                    stats["missing_ratings"] += j_stats.get("missing_ratings", 0)
                    stats["missing_text"] += j_stats.get("missing_text", 0)
                    stats["missing_products"] += j_stats.get("missing_products", 0)
                    stats["invalid_ratings"] += j_stats.get("invalid_ratings", 0)
                    stats["invalid_dates"] += j_stats.get("invalid_dates", 0)
                except Exception:
                    pass

        return stats
