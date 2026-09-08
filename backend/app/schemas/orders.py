from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import Field, model_validator

from app.models.enums import OrderStatus, PaymentMethod
from app.schemas.common import DatedSchema, IdSchema, Schema


class CartLine(Schema):
    product_id: UUID
    quantity: int = Field(ge=1, le=99)


class CartInput(Schema):
    restaurant_id: UUID
    items: list[CartLine] = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def unique_products(self):
        if len({line.product_id for line in self.items}) != len(self.items):
            raise ValueError("Duplicate products are not allowed")
        return self


class OrderCreate(CartInput):
    delivery_address_id: UUID
    contact_phone: str = Field(pattern=r"^\+996\d{9}$")
    payment_method: PaymentMethod
    customer_comment: str = Field(default="", max_length=1000)
    idempotency_key: UUID
    expected_total: Decimal = Field(ge=0, decimal_places=2)


class QuoteLine(Schema):
    product_id: UUID
    product_name: str
    product_image_url: str
    unit_price: Decimal
    quantity: int
    total_price: Decimal


class Quote(Schema):
    items: list[QuoteLine]
    subtotal: Decimal
    delivery_fee: Decimal
    discount: Decimal = Decimal("0")
    total: Decimal


class HistoryOut(DatedSchema):
    from_status: OrderStatus | None
    to_status: OrderStatus


class OrderItemOut(QuoteLine, IdSchema):
    pass


class OrderOut(Quote, DatedSchema):
    order_number: str
    restaurant_id: UUID
    restaurant_name: str
    courier_id: UUID | None
    status: OrderStatus
    address_snapshot: dict[str, str]
    contact_phone: str
    payment_method: PaymentMethod
    payment_status: str
    customer_comment: str
    items: list[OrderItemOut]
    history: list[HistoryOut]
    delivered_at: datetime | None


class StatusPatch(Schema):
    status: OrderStatus


class ReviewCreate(Schema):
    order_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=2000)


class ReviewOut(DatedSchema):
    order_id: UUID
    restaurant_id: UUID
    author_name: str
    rating: int
    comment: str
