from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Identity, Timestamps, now
from app.models.enums import OrderStatus, PaymentMethod


class Order(Identity, Timestamps, Base):
    __tablename__ = "orders"
    __table_args__ = (
        UniqueConstraint("customer_id", "idempotency_key"),
        CheckConstraint("total >= 0 AND subtotal >= 0", name="positive_totals"),
    )
    order_number: Mapped[str] = mapped_column(String(30), unique=True)
    customer_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    restaurant_id: Mapped[UUID] = mapped_column(ForeignKey("restaurants.id"), index=True)
    restaurant_name: Mapped[str] = mapped_column(String(200))
    courier_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    delivery_address_id: Mapped[UUID] = mapped_column(ForeignKey("addresses.id"))
    address_snapshot: Mapped[dict] = mapped_column(JSONB)
    contact_phone: Mapped[str] = mapped_column(String(30))
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), index=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    delivery_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    discount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    payment_method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod))
    payment_status: Mapped[str] = mapped_column(String(30), default="PENDING")
    customer_comment: Mapped[str] = mapped_column(String(1000), default="")
    idempotency_key: Mapped[UUID]
    request_fingerprint: Mapped[str] = mapped_column(String(64))
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)
    items: Mapped[list["OrderItem"]] = relationship(lazy="selectin")
    history: Mapped[list["OrderStatusHistory"]] = relationship(
        lazy="selectin", order_by="OrderStatusHistory.created_at"
    )


class OrderItem(Identity, Base):
    __tablename__ = "order_items"
    __table_args__ = (CheckConstraint("quantity > 0", name="positive_quantity"),)
    order_id: Mapped[UUID] = mapped_column(ForeignKey("orders.id"), index=True)
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id"))
    product_name: Mapped[str] = mapped_column(String(200))
    product_image_url: Mapped[str] = mapped_column(String(2048))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    quantity: Mapped[int]
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))


class OrderStatusHistory(Identity, Base):
    __tablename__ = "order_status_history"
    order_id: Mapped[UUID] = mapped_column(ForeignKey("orders.id"), index=True)
    from_status: Mapped[OrderStatus | None] = mapped_column(Enum(OrderStatus))
    to_status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus))
    changed_by_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Review(Identity, Timestamps, Base):
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="rating_range"),)
    order_id: Mapped[UUID] = mapped_column(ForeignKey("orders.id"), unique=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    restaurant_id: Mapped[UUID] = mapped_column(ForeignKey("restaurants.id"), index=True)
    author_name: Mapped[str] = mapped_column(String(100))
    rating: Mapped[int]
    comment: Mapped[str] = mapped_column(String(2000), default="")


class CourierDelivery(Identity, Timestamps, Base):
    __tablename__ = "courier_deliveries"
    order_id: Mapped[UUID] = mapped_column(ForeignKey("orders.id"), unique=True)
    courier_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class PromoCode(Identity, Timestamps, Base):
    __tablename__ = "promo_codes"
    __table_args__ = (CheckConstraint("discount_amount >= 0", name="positive_discount"),)
    code: Mapped[str] = mapped_column(String(50), unique=True)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    is_active: Mapped[bool] = mapped_column(default=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
