from uuid import UUID

from pydantic import Field

from app.models.enums import Role, Vehicle
from app.schemas.common import IdSchema, Schema


class UserOut(IdSchema):
    email: str | None
    phone: str | None
    first_name: str
    last_name: str
    role: Role
    is_blocked: bool


class ProfilePatch(Schema):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(default="", max_length=100)
    phone: str = Field(pattern=r"^\+996\d{9}$")


class CityOut(IdSchema):
    name: str
    country: str
    timezone: str


class AddressWrite(Schema):
    city_id: UUID
    label: str = Field(default="Дом", min_length=1, max_length=50)
    street: str = Field(min_length=2, max_length=200)
    house: str = Field(min_length=1, max_length=30)
    apartment: str = Field(default="", max_length=30)
    entrance: str = Field(default="", max_length=30)
    floor: str = Field(default="", max_length=30)
    comment: str = Field(default="", max_length=1000)
    is_default: bool = False


class AddressOut(AddressWrite, IdSchema):
    pass


class CourierPatch(Schema):
    vehicle_type: Vehicle = Vehicle.BICYCLE
    is_online: bool = False


class CourierOut(CourierPatch):
    user_id: UUID
    is_verified: bool
