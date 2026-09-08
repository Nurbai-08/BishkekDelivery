from datetime import time
from decimal import Decimal
from uuid import UUID

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Identity, Timestamps
from app.models.enums import ImageSource


class Cuisine(Identity, Base):
    __tablename__ = "cuisines"
    name: Mapped[str] = mapped_column(String(100))
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    image_url: Mapped[str] = mapped_column(String(2048), default="")
    is_active: Mapped[bool] = mapped_column(default=True)
    sort_order: Mapped[int] = mapped_column(default=0)


class RestaurantCuisine(Base):
    __tablename__ = "restaurant_cuisines"
    restaurant_id: Mapped[UUID] = mapped_column(ForeignKey("restaurants.id"), primary_key=True)
    cuisine_id: Mapped[UUID] = mapped_column(ForeignKey("cuisines.id"), primary_key=True)


class Restaurant(Identity, Timestamps, Base):
    __tablename__ = "restaurants"
    __table_args__ = (
        CheckConstraint("minimum_order >= 0 AND base_delivery_fee >= 0", name="positive_prices"),
    )
    city_id: Mapped[UUID] = mapped_column(ForeignKey("cities.id"), index=True)
    owner_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(2000), default="")
    phone: Mapped[str] = mapped_column(String(30), default="")
    email: Mapped[str] = mapped_column(String(320), default="")
    logo_url: Mapped[str] = mapped_column(String(2048), default="")
    cover_url: Mapped[str] = mapped_column(String(2048), default="")
    image_source: Mapped[ImageSource] = mapped_column(Enum(ImageSource), default=ImageSource.SYSTEM)
    image_attribution: Mapped[str] = mapped_column(String(1000), default="")
    address_text: Mapped[str] = mapped_column(String(400), default="")
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=0)
    review_count: Mapped[int] = mapped_column(default=0)
    minimum_order: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    base_delivery_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=100)
    estimated_delivery_min: Mapped[int] = mapped_column(default=25)
    estimated_delivery_max: Mapped[int] = mapped_column(default=40)
    opening_time: Mapped[time] = mapped_column(default=time(9))
    closing_time: Mapped[time] = mapped_column(default=time(23))
    is_open: Mapped[bool] = mapped_column(default=True)
    is_active: Mapped[bool] = mapped_column(default=True, index=True)
    is_verified: Mapped[bool] = mapped_column(default=False)
    is_featured: Mapped[bool] = mapped_column(default=False)
    is_demo: Mapped[bool] = mapped_column(default=False)
    cuisines: Mapped[list[Cuisine]] = relationship(secondary="restaurant_cuisines", lazy="selectin")


class RestaurantMember(Base):
    __tablename__ = "restaurant_members"
    restaurant_id: Mapped[UUID] = mapped_column(ForeignKey("restaurants.id"), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)


class MenuCategory(Identity, Base):
    __tablename__ = "menu_categories"
    __table_args__ = (UniqueConstraint("restaurant_id", "slug"),)
    restaurant_id: Mapped[UUID] = mapped_column(ForeignKey("restaurants.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    slug: Mapped[str] = mapped_column(String(100))
    sort_order: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(default=True)


class Product(Identity, Timestamps, Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "slug"),
        CheckConstraint("price >= 0", name="positive_price"),
    )
    restaurant_id: Mapped[UUID] = mapped_column(ForeignKey("restaurants.id"), index=True)
    menu_category_id: Mapped[UUID] = mapped_column(ForeignKey("menu_categories.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(String(2000), default="")
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    weight_value: Mapped[int | None]
    weight_unit: Mapped[str] = mapped_column(String(20), default="г")
    image_url: Mapped[str] = mapped_column(String(2048), default="")
    image_source: Mapped[ImageSource] = mapped_column(Enum(ImageSource), default=ImageSource.SYSTEM)
    image_attribution: Mapped[str] = mapped_column(String(1000), default="")
    is_available: Mapped[bool] = mapped_column(default=True, index=True)
    is_featured: Mapped[bool] = mapped_column(default=False)
    is_active: Mapped[bool] = mapped_column(default=True)


class Favorite(Timestamps, Base):
    __tablename__ = "favorites"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    restaurant_id: Mapped[UUID] = mapped_column(ForeignKey("restaurants.id"), primary_key=True)
