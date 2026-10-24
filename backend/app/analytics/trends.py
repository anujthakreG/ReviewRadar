"""
ReviewRadar Time-Series Analytics Engine
Aggregates temporal review volume and rating trends, computes 7-period SMA and EMA,
and performs cautious forecasting only when sufficient temporal points exist.
"""

from typing import List, Dict, Any, Optional
from datetime import timedelta
import pandas as pd
import numpy as np


MIN_OBSERVATIONS_FOR_FORECAST = 7


def calculate_trends(
    reviews_data: List[Dict[str, Any]],
    forecast_horizon: int = 5,
) -> Dict[str, Any]:
    """
    Computes time-series metrics from review records with valid dates.
    Returns:
        dict with points, forecast_available, forecast_message, summary.
    """
    valid_dates_data = [r for r in reviews_data if r.get("review_date") is not None]

    if not valid_dates_data:
        return {
            "points": [],
            "forecast_available": False,
            "forecast_message": "No valid review dates found in the dataset to perform time-series analysis.",
            "summary": {
                "total_dated_reviews": 0,
                "first_date": None,
                "last_date": None,
                "date_span_days": 0,
            },
        }

    df = pd.DataFrame(valid_dates_data)
    df["review_date"] = pd.to_datetime(df["review_date"])

    # Aggregate by date
    grouped = (
        df.groupby("review_date")
        .agg(
            review_count=("rating", "count"),
            average_rating=("rating", "mean"),
        )
        .reset_index()
        .sort_values("review_date")
    )

    grouped["average_rating"] = grouped["average_rating"].round(2)

    # Calculate 7-period Simple Moving Average (SMA) and Exponential Moving Average (EMA)
    grouped["sma_7"] = grouped["review_count"].rolling(window=7, min_periods=1).mean().round(2)
    grouped["ema_7"] = grouped["review_count"].ewm(span=7, adjust=False).mean().round(2)

    points: List[Dict[str, Any]] = []
    for _, row in grouped.iterrows():
        points.append({
            "date": row["review_date"].strftime("%Y-%m-%d"),
            "review_count": int(row["review_count"]),
            "average_rating": float(row["average_rating"]),
            "sma_7": float(row["sma_7"]) if pd.notna(row["sma_7"]) else None,
            "ema_7": float(row["ema_7"]) if pd.notna(row["ema_7"]) else None,
            "is_forecast": False,
        })

    num_observations = len(grouped)
    first_date = grouped["review_date"].min()
    last_date = grouped["review_date"].max()
    date_span_days = (last_date - first_date).days

    forecast_available = False
    forecast_message = ""

    if num_observations < MIN_OBSERVATIONS_FOR_FORECAST:
        forecast_message = (
            f"Forecasting disabled: Found {num_observations} temporal observation(s). "
            f"A minimum of {MIN_OBSERVATIONS_FOR_FORECAST} distinct dates is required to calculate reliable trend projections."
        )
    else:
        forecast_available = True
        forecast_message = (
            f"Projected next {forecast_horizon} periods using linear regression trend over {num_observations} observed dates. "
            "Note: Projections assume continuity of historical acquisition patterns and do not account for external market events."
        )

        # Compute simple linear trend for volume
        x = np.arange(num_observations)
        y = grouped["review_count"].values
        slope, intercept = np.polyfit(x, y, 1)

        last_observed_date = grouped["review_date"].iloc[-1]
        overall_avg_rating = round(float(df["rating"].mean()), 2)

        for i in range(1, forecast_horizon + 1):
            future_date = last_observed_date + timedelta(days=i)
            projected_volume = max(0, int(round(slope * (num_observations + i - 1) + intercept)))
            points.append({
                "date": future_date.strftime("%Y-%m-%d"),
                "review_count": projected_volume,
                "average_rating": overall_avg_rating,
                "sma_7": None,
                "ema_7": None,
                "is_forecast": True,
            })

    summary = {
        "total_dated_reviews": len(df),
        "first_date": first_date.strftime("%Y-%m-%d") if pd.notna(first_date) else None,
        "last_date": last_date.strftime("%Y-%m-%d") if pd.notna(last_date) else None,
        "date_span_days": date_span_days,
        "unique_temporal_points": num_observations,
    }

    return {
        "points": points,
        "forecast_available": forecast_available,
        "forecast_message": forecast_message,
        "summary": summary,
    }
