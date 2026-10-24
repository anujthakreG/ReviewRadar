"""
Import Service
Manages file parsing (CSV, Excel, JSON), preview generation, data cleaning execution,
sentiment calculation, and database persistence.
"""

from typing import Dict, Any, List, Optional
import io
import json
import pandas as pd
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.review import Review
from app.models.import_job import ImportJob
from app.analytics.cleaner import (
    DataCleaningPipeline,
    auto_detect_mapping,
)
from app.analytics.sentiment import analyze_sentiment


class ImportService:
    def __init__(self, db: Session):
        self.db = db

    def parse_file_to_dataframe(self, contents: bytes, filename: str) -> pd.DataFrame:
        """Parses uploaded file bytes to a pandas DataFrame based on file extension."""
        ext = filename.lower().split(".")[-1]

        if ext == "csv":
            try:
                df = pd.read_csv(io.BytesIO(contents), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
        elif ext in ["xlsx", "xls"]:
            df = pd.read_excel(io.BytesIO(contents))
        elif ext == "json":
            try:
                data = json.loads(contents.decode("utf-8"))
            except UnicodeDecodeError:
                data = json.loads(contents.decode("latin-1"))

            if isinstance(data, list):
                df = pd.DataFrame(data)
            elif isinstance(data, dict):
                # If wrapped under a key like 'reviews' or 'data'
                for candidate_key in ["reviews", "data", "items"]:
                    if candidate_key in data and isinstance(data[candidate_key], list):
                        df = pd.DataFrame(data[candidate_key])
                        break
                else:
                    df = pd.DataFrame([data])
            else:
                raise ValueError("Unsupported JSON layout. Expected list of review objects.")
        else:
            raise ValueError(f"Unsupported file format: .{ext}. Please upload a CSV, Excel (.xlsx), or JSON file.")

        return df

    def generate_preview(self, contents: bytes, filename: str) -> Dict[str, Any]:
        """Generates schema preview, auto-mapping, and sample rows for file confirmation."""
        df = self.parse_file_to_dataframe(contents, filename)
        columns = [str(c) for c in df.columns]
        suggested_mapping = auto_detect_mapping(columns)

        # Sample rows (up to 5)
        sample_df = df.head(5).copy()
        # Convert NaNs to None for valid JSON serialization
        sample_rows = sample_df.where(pd.notna(sample_df), None).to_dict(orient="records")

        # Preliminary quality scan
        total_rows = len(df)
        mapped_rating_col = suggested_mapping.get("rating")
        mapped_text_col = suggested_mapping.get("review_text")

        missing_ratings_est = (
            int(df[mapped_rating_col].isna().sum()) if mapped_rating_col and mapped_rating_col in df.columns else 0
        )
        missing_text_est = (
            int(df[mapped_text_col].isna().sum()) if mapped_text_col and mapped_text_col in df.columns else 0
        )

        return {
            "filename": filename,
            "total_rows_detected": total_rows,
            "detected_columns": columns,
            "sample_rows": sample_rows,
            "suggested_mapping": suggested_mapping,
            "preliminary_quality": {
                "total_rows": total_rows,
                "missing_ratings_count": missing_ratings_est,
                "missing_text_count": missing_text_est,
                "has_rating_column": bool(mapped_rating_col and mapped_rating_col in df.columns),
                "has_text_column": bool(mapped_text_col and mapped_text_col in df.columns),
            },
        }

    def execute_import(
        self,
        contents: bytes,
        filename: str,
        column_mapping: Optional[Dict[str, str]] = None,
        rating_scale_min: float = 1.0,
        rating_scale_max: float = 5.0,
    ) -> Dict[str, Any]:
        """Executes full cleaning, sentiment classification, and ingestion into the database."""
        df = self.parse_file_to_dataframe(contents, filename)

        # Retrieve existing content hashes and external IDs from database
        existing_hashes = {
            r[0] for r in self.db.query(Review.content_hash).filter(Review.content_hash.isnot(None)).all()
        }
        existing_ext_ids = {
            r[0] for r in self.db.query(Review.external_id).filter(Review.external_id.isnot(None)).all()
        }

        # Run cleaning pipeline
        pipeline = DataCleaningPipeline(
            rating_min=rating_scale_min,
            rating_max=rating_scale_max,
            existing_hashes=existing_hashes,
            existing_external_ids=existing_ext_ids,
        )

        valid_records, quality_report = pipeline.clean_dataframe(df, column_mapping=column_mapping)
        stats = quality_report["stats"]

        # Cache existing products
        products_map = {p.name.lower(): p for p in self.db.query(Product).all()}

        # Ingest valid records
        for rec in valid_records:
            prod_key = rec["product_name"].lower()
            if prod_key not in products_map:
                new_product = Product(
                    name=rec["product_name"],
                    external_id=rec["external_product_id"],
                )
                self.db.add(new_product)
                self.db.flush()
                products_map[prod_key] = new_product

            product_obj = products_map[prod_key]

            # Sentiment calculation
            sentiment_res = analyze_sentiment(rec["review_text"])

            review_obj = Review(
                external_id=rec["external_id"],
                product_id=product_obj.id,
                rating=rec["rating"],
                review_title=rec["review_title"],
                review_text=rec["review_text"],
                review_date=rec["review_date"],
                sentiment_label=sentiment_res["label"],
                sentiment_score=sentiment_res["score"],
                reviewer_name=rec["reviewer_name"],
                verified_purchase=rec["verified_purchase"],
                content_hash=rec["content_hash"],
            )
            self.db.add(review_obj)

        # Record import job
        import_job = ImportJob(
            filename=filename,
            rows_processed=stats["total_rows_processed"],
            rows_imported=stats["valid_rows"],
            rows_rejected=stats["rejected_rows"],
            rows_duplicate=stats["duplicate_rows"],
            status="completed" if stats["rejected_rows"] == 0 else "partial",
            summary_details=json.dumps({
                "stats": stats,
                "rejection_reasons": stats.get("rejection_reasons", {}),
            }),
        )
        self.db.add(import_job)
        self.db.commit()
        self.db.refresh(import_job)

        return {
            "job_id": import_job.id,
            "filename": filename,
            "rows_processed": stats["total_rows_processed"],
            "rows_imported": stats["valid_rows"],
            "rows_rejected": stats["rejected_rows"],
            "rows_duplicate": stats["duplicate_rows"],
            "status": import_job.status,
            "issues_summary": stats.get("rejection_reasons", {}),
            "rejected_rows_sample": quality_report.get("problematic_rows_sample", []),
        }
