from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.api.routes import (
    health,
    uploads,
    reviews,
    products,
    analytics,
    insights,
    sample_data,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables automatically on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="ReviewRadar API",
    description="Full-stack product review analytics platform API powered by FastAPI, Pandas, and VADER sentiment analysis.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
api_prefix = settings.API_V1_STR

app.include_router(health.router, prefix=api_prefix)
app.include_router(uploads.router, prefix=api_prefix)
app.include_router(reviews.router, prefix=api_prefix)
app.include_router(products.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(insights.router, prefix=api_prefix)
app.include_router(sample_data.router, prefix=api_prefix)


@app.get("/")
def root():
    return {
        "message": "Welcome to ReviewRadar API. Visit /docs for the interactive Swagger documentation.",
        "docs": "/docs",
        "health": f"{api_prefix}/health",
    }
