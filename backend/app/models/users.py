from decimal import Decimal
from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Identity, Timestamps
from app.models.enums import Role, Vehicle


class City(Identity, Timestamps, Base):
    __tablename__ = "cities"
    name: Mapped[str] = mapped_column(String(100), unique=True)
    country: Mapped[str] = mapped_column(String(100))
    timezone: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(default=True)


class User(Identity, Timestamps, Base):
    __tablename__ = "users"
    firebase_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(320))
    phone: Mapped[str | None] = mapped_column(String(30))
    first_name: Mapped[str] = mapped_column(String(100), default="")
    last_name: Mapped[str] = mapped_column(String(100), default="")
    avatar_url: Mapped[str | None] = mapped_column(String(2048))
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.CUSTOMER)
    is_active: Mapped[bool] = mapped_column(default=True)
    is_blocked: Mapped[bool] = mapped_column(default=False)


class Address(Identity, Timestamps, Base):
    __tablename__ = "addresses"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    city_id: Mapped[UUID] = mapped_column(ForeignKey("cities.id"))
    label: Mapped[str] = mapped_column(String(50), default="Дом")
    street: Mapped[str] = mapped_column(String(200))
    house: Mapped[str] = mapped_column(String(30))
    apartment: Mapped[str] = mapped_column(String(30), default="")
    entrance: Mapped[str] = mapped_column(String(30), default="")
    floor: Mapped[str] = mapped_column(String(30), default="")
    comment: Mapped[str] = mapped_column(String(1000), default="")
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    is_default: Mapped[bool] = mapped_column(default=False)


class CourierProfile(Timestamps, Base):
    __tablename__ = "courier_profiles"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    vehicle_type: Mapped[Vehicle] = mapped_column(Enum(Vehicle), default=Vehicle.BICYCLE)
    is_online: Mapped[bool] = mapped_column(default=False)
    is_verified: Mapped[bool] = mapped_column(default=False)
    rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=0)
