"""
ReviewRadar Data Cleaning Pipeline
Handles schema normalization, whitespace trimming, missing value detection,
rating scale validation, date parsing, and duplicate detection using Pandas.
"""

from typing import Dict, Any, List, Tuple, Optional
import hashlib
import pandas as pd
import numpy as np


STANDARD_COLUMNS = [
    "review_id",
    "product_name",
    "product_id",
    "rating",
    "review_title",
    "review_text",
    "review_date",
    "reviewer_name",
    "verified_purchase",
]


def normalize_column_name(col: str) -> str:
    """Normalizes raw column names (lowercase, strips spaces, replaces underscores/hyphens)."""
    if not isinstance(col, str):
        return str(col)
    s = col.strip().lower()
    s = s.replace("-", "_").replace(" ", "_").replace(".", "_")
    return s


def auto_detect_mapping(columns: List[str]) -> Dict[str, Optional[str]]:
    """Automatically maps detected file columns to standard ReviewRadar fields."""
    normalized_cols = {normalize_column_name(c): c for c in columns}
    mapping: Dict[str, Optional[str]] = {}

    alias_patterns = {
        "review_id": ["review_id", "id", "reviewid", "rev_id", "order_id"],
        "product_name": ["product_name", "product", "item_name", "item", "product_title", "title_product"],
        "product_id": ["product_id", "prod_id", "asin", "sku", "item_id"],
        "rating": ["rating", "stars", "score", "review_rating", "user_rating"],
        "review_title": ["review_title", "title", "headline", "summary", "subject"],
        "review_text": ["review_text", "text", "body", "content", "comments", "review", "review_body"],
        "review_date": ["review_date", "date", "created_at", "timestamp", "posted_date", "time"],
        "reviewer_name": ["reviewer_name", "reviewer", "user_name", "user", "author", "customer_name"],
        "verified_purchase": ["verified_purchase", "verified", "is_verified", "verified_buyer"],
    }

    for std_field, candidates in alias_patterns.items():
        matched = None
        for candidate in candidates:
            if candidate in normalized_cols:
                matched = normalized_cols[candidate]
                break
        mapping[std_field] = matched

    return mapping


def generate_content_hash(product_name: str, rating: float, text: str) -> str:
    """Generates a reproducible SHA256 content hash to identify duplicate reviews."""
    raw = f"{str(product_name).strip().lower()}||{float(rating)}||{str(text).strip().lower()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class DataCleaningPipeline:
    def __init__(
        self,
        rating_min: float = 1.0,
        rating_max: float = 5.0,
        existing_hashes: Optional[set] = None,
        existing_external_ids: Optional[set] = None,
    ):
        self.rating_min = rating_min
        self.rating_max = rating_max
        self.existing_hashes = set(existing_hashes) if existing_hashes else set()
        self.existing_external_ids = set(existing_external_ids) if existing_external_ids else set()

    def clean_dataframe(
        self,
        df: pd.DataFrame,
        column_mapping: Optional[Dict[str, str]] = None,
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Executes cleaning pipeline on a pandas DataFrame.
        Returns:
            Tuple of (valid_records, quality_report)
        """
        raw_total_rows = len(df)
        df_work = df.copy()

        # Apply column mapping
        if column_mapping:
            rename_dict = {orig: std for std, orig in column_mapping.items() if orig and orig in df_work.columns}
            df_work = df_work.rename(columns=rename_dict)

        # Track issues
        stats = {
            "total_rows_processed": raw_total_rows,
            "valid_rows": 0,
            "rejected_rows": 0,
            "duplicate_rows": 0,
            "missing_ratings": 0,
            "missing_text": 0,
            "missing_products": 0,
            "invalid_ratings": 0,
            "invalid_dates": 0,
            "rejection_reasons": {},
        }
        problematic_rows_sample = []
        valid_records: List[Dict[str, Any]] = []

        seen_in_batch_hashes = set()
        seen_in_batch_ids = set()

        for idx, row in df_work.iterrows():
            row_num = int(idx) + 1
            rejection_reasons = []

            # 1. Product Name check
            raw_product = row.get("product_name")
            product_name = None
            if pd.isna(raw_product) or not str(raw_product).strip():
                stats["missing_products"] += 1
                rejection_reasons.append("Missing product name")
            else:
                product_name = str(raw_product).strip()

            # 2. Rating validation
            raw_rating = row.get("rating")
            parsed_rating = None
            if pd.isna(raw_rating) or str(raw_rating).strip() == "":
                stats["missing_ratings"] += 1
                rejection_reasons.append("Missing rating value")
            else:
                try:
                    val = float(str(raw_rating).strip())
                    if np.isnan(val):
                        stats["missing_ratings"] += 1
                        rejection_reasons.append("Missing/NaN rating value")
                    elif val < self.rating_min or val > self.rating_max:
                        stats["invalid_ratings"] += 1
                        rejection_reasons.append(
                            f"Rating {val} outside allowed scale [{self.rating_min}, {self.rating_max}]"
                        )
                    else:
                        parsed_rating = round(val, 2)
                except (ValueError, TypeError):
                    stats["invalid_ratings"] += 1
                    rejection_reasons.append(f"Rating '{raw_rating}' could not be parsed as a number")

            # 3. Review Text validation
            raw_text = row.get("review_text")
            review_text = None
            if pd.isna(raw_text) or not str(raw_text).strip():
                stats["missing_text"] += 1
                rejection_reasons.append("Missing or whitespace-only review text")
            else:
                review_text = str(raw_text).strip()

            # 4. Optional fields
            raw_title = row.get("review_title")
            review_title = str(raw_title).strip() if (pd.notna(raw_title) and str(raw_title).strip()) else None

            raw_reviewer = row.get("reviewer_name")
            reviewer_name = str(raw_reviewer).strip() if (pd.notna(raw_reviewer) and str(raw_reviewer).strip()) else None

            raw_verified = row.get("verified_purchase")
            verified_purchase = None
            if pd.notna(raw_verified):
                if isinstance(raw_verified, bool):
                    verified_purchase = raw_verified
                else:
                    s_ver = str(raw_verified).strip().lower()
                    if s_ver in ["true", "1", "yes", "y"]:
                        verified_purchase = True
                    elif s_ver in ["false", "0", "no", "n"]:
                        verified_purchase = False

            raw_external_id = row.get("review_id")
            external_id = str(raw_external_id).strip() if (pd.notna(raw_external_id) and str(raw_external_id).strip()) else None

            raw_product_id = row.get("product_id")
            external_product_id = str(raw_product_id).strip() if (pd.notna(raw_product_id) and str(raw_product_id).strip()) else None

            # 5. Date parsing
            raw_date = row.get("review_date")
            review_date = None
            if pd.notna(raw_date) and str(raw_date).strip():
                try:
                    parsed_dt = pd.to_datetime(str(raw_date).strip())
                    review_date = parsed_dt.date()
                except Exception:
                    stats["invalid_dates"] += 1
                    # Documented rule: We preserve the review if rating and text are valid, but note invalid date
                    review_date = None

            # 6. Duplicate detection (only if core fields are present)
            is_duplicate = False
            content_hash = None
            if product_name and parsed_rating is not None and review_text:
                content_hash = generate_content_hash(product_name, parsed_rating, review_text)

                if external_id and (external_id in self.existing_external_ids or external_id in seen_in_batch_ids):
                    is_duplicate = True
                    rejection_reasons.append(f"Duplicate review ID detected: {external_id}")
                elif content_hash in self.existing_hashes or content_hash in seen_in_batch_hashes:
                    is_duplicate = True
                    rejection_reasons.append("Exact duplicate review content detected")

            if is_duplicate:
                stats["duplicate_rows"] += 1

            # Decide on row inclusion
            if rejection_reasons:
                stats["rejected_rows"] += 1
                for r in rejection_reasons:
                    stats["rejection_reasons"][r] = stats["rejection_reasons"].get(r, 0) + 1

                if len(problematic_rows_sample) < 20:
                    problematic_rows_sample.append({
                        "row_number": row_num,
                        "raw_data": {k: (str(v) if pd.notna(v) else None) for k, v in row.items()},
                        "reasons": rejection_reasons,
                    })
            else:
                stats["valid_rows"] += 1
                if external_id:
                    seen_in_batch_ids.add(external_id)
                if content_hash:
                    seen_in_batch_hashes.add(content_hash)

                valid_records.append({
                    "product_name": product_name,
                    "external_product_id": external_product_id,
                    "rating": parsed_rating,
                    "review_title": review_title,
                    "review_text": review_text,
                    "review_date": review_date,
                    "reviewer_name": reviewer_name,
                    "verified_purchase": verified_purchase,
                    "external_id": external_id,
                    "content_hash": content_hash,
                })

        report = {
            "stats": stats,
            "problematic_rows_sample": problematic_rows_sample,
        }
        return valid_records, report
