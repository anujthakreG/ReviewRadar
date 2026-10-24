from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.db.session import Base


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    rows_processed = Column(Integer, default=0, nullable=False)
    rows_imported = Column(Integer, default=0, nullable=False)
    rows_rejected = Column(Integer, default=0, nullable=False)
    rows_duplicate = Column(Integer, default=0, nullable=False)
    
    status = Column(String(50), default="completed", nullable=False)  # completed, partial, failed
    summary_details = Column(Text, nullable=True)  # JSON-encoded summary / error details
