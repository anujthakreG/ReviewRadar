from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ProductBase(BaseModel):
    name: str
    external_id: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    review_count: Optional[int] = 0
    average_rating: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)
