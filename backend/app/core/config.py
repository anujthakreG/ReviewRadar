import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


def get_default_database_url() -> str:
    # If on Vercel Serverless and no explicit DB URL is configured, use /tmp to prevent read-only filesystem crash
    if os.getenv("VERCEL"):
        return "sqlite:////tmp/reviewradar.db"
    return "sqlite:///./reviewradar.db"


class Settings(BaseSettings):
    PROJECT_NAME: str = "ReviewRadar"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = get_default_database_url()
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://review-radar-sepia.vercel.app",
    ]
    DEFAULT_RATING_MIN: float = 1.0
    DEFAULT_RATING_MAX: float = 5.0
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="allow",
    )

    @field_validator("DATABASE_URL", mode="before")
    def assemble_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            # Convert legacy 'postgres://' schema to modern SQLAlchemy 'postgresql://'
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql://", 1)
            # If on Vercel and relative SQLite path is specified, redirect to writable /tmp
            if os.getenv("VERCEL") and v.startswith("sqlite:///."):
                return "sqlite:////tmp/reviewradar.db"
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        default_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://review-radar-sepia.vercel.app",
        ]
        if isinstance(v, str):
            if v.strip() == "*":
                return ["*"]
            if not v.startswith("["):
                origins = [i.strip() for i in v.split(",") if i.strip()]
                for d in default_origins:
                    if d not in origins:
                        origins.append(d)
                return origins
        elif isinstance(v, list):
            origins = list(v)
            for d in default_origins:
                if d not in origins:
                    origins.append(d)
            return origins
        return default_origins


settings = Settings()
