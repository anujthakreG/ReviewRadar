from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Configure engine arguments based on database engine dialect
db_url = settings.DATABASE_URL
engine_kwargs = {"echo": False}

if db_url.startswith("sqlite"):
    # For SQLite, check_same_thread=False allows FastAPI multi-threaded requests
    engine_kwargs["connect_args"] = {"check_same_thread": False}
elif db_url.startswith("postgresql"):
    # For PostgreSQL in production, enable pre-ping to reconnect dropped pooled sockets
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
