from decimal import Decimal
from uuid import UUID

from pydantic import Field

from app.models.enums import ImageSource
from app.schemas.common import IdSchema, Schema


class CuisineOut(IdSchema):
    name: str
    slug: str
    image_url: str


class RestaurantOut(IdSchema):
    city_id: UUID
    name: str
    slug: str
    description: str
    cover_url: str
    logo_url: str
    image_source: ImageSource
    image_attribution: str
    address_text: str
    rating: Decimal
    review_count: int
    minimum_order: Decimal
    base_delivery_fee: Decimal
    estimated_delivery_min: int
    estimated_delivery_max: int
    is_open: bool
    is_active: bool
    is_verified: bool
    is_featured: bool
    is_demo: bool
    cuisines: list[CuisineOut]


class ProductOut(IdSchema):
    restaurant_id: UUID
    menu_category_id: UUID
    name: str
    slug: str
    description: str
    price: Decimal
    weight_value: int | None
    weight_unit: str
    image_url: str
    image_source: ImageSource
    image_attribution: str
    is_available: bool
    is_featured: bool


class CategoryOut(IdSchema):
    restaurant_id: UUID
    name: str
    slug: str
    sort_order: int
    is_active: bool


class MenuOut(Schema):
    categories: list[CategoryOut]
    products: list[ProductOut]


class ProductWrite(Schema):
    restaurant_id: UUID
    menu_category_id: UUID
    name: str = Field(min_length=2, max_length=200)
    slug: str = Field(pattern=r"^[a-z0-9-]+$", max_length=200)
    description: str = Field(default="", max_length=2000)
    price: Decimal = Field(ge=0, le=1000000, decimal_places=2)
    weight_value: int | None = Field(default=None, gt=0)
    weight_unit: str = Field(default="г", max_length=20)
    is_available: bool = True
    is_featured: bool = False


class ProductPatch(Schema):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    price: Decimal | None = Field(default=None, ge=0, le=1000000, decimal_places=2)
    is_available: bool | None = None
    is_featured: bool | None = None


class CategoryWrite(Schema):
    restaurant_id: UUID
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(pattern=r"^[a-z0-9-]+$", max_length=100)
    sort_order: int = Field(default=0, ge=0)


class RestaurantPatch(Schema):
    description: str | None = Field(default=None, max_length=2000)
    is_open: bool | None = None
