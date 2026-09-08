from decimal import Decimal
from uuid import UUID

from pydantic import Field, model_validator

from app.schemas.common import Schema


class RestaurantCreate(Schema):
    city_id: UUID
    owner_id: UUID
    name: str = Field(min_length=2, max_length=200)
    slug: str = Field(pattern=r"^[a-z0-9-]+$", max_length=200)
    description: str = Field(default="", max_length=2000)
    address_text: str = Field(min_length=3, max_length=400)
    phone: str = Field(pattern=r"^\+996\d{9}$")
    cuisine_ids: list[UUID] = Field(min_length=1, max_length=10)
    minimum_order: Decimal = Field(default=0, ge=0, le=1000000, decimal_places=2)
    base_delivery_fee: Decimal = Field(default=100, ge=0, le=10000, decimal_places=2)
    estimated_delivery_min: int = Field(default=25, ge=5, le=180)
    estimated_delivery_max: int = Field(default=40, ge=5, le=180)

    @model_validator(mode="after")
    def valid_range(self):
        if self.estimated_delivery_min > self.estimated_delivery_max:
            raise ValueError("Invalid delivery time range")
        return self
