from uuid import UUID

from fastapi import APIRouter
from pydantic import Field
from sqlalchemy import select

from app.api.v1.catalog import PageNumber, PageSize
from app.core.errors import DomainError
from app.dependencies.auth import Actor, Db, require_role
from app.models import CourierProfile, Cuisine, Order, Restaurant, Review, User
from app.models.enums import Role
from app.repositories.common import get_or_404, paginate
from app.schemas.catalog import CuisineOut, RestaurantOut
from app.schemas.common import Page, Schema
from app.schemas.management import RestaurantCreate
from app.schemas.orders import OrderOut, ReviewOut
from app.schemas.users import CourierOut, UserOut
from app.services.management import ManagementService

router = APIRouter(prefix="/admin", tags=["Admin"])


class UserPatch(Schema):
    is_blocked: bool | None = None
    role: Role | None = None


class ModerationPatch(Schema):
    is_active: bool | None = None
    is_verified: bool | None = None
    is_featured: bool | None = None
    owner_id: UUID | None = None


class CourierApproval(Schema):
    is_verified: bool


class CuisineWrite(Schema):
    name: str = Field(min_length=2, max_length=100)
    slug: str = Field(pattern=r"^[a-z0-9-]+$", max_length=100)
    is_active: bool = True
    sort_order: int = Field(default=0, ge=0)


@router.get("/users", response_model=Page[UserOut])
def users(user: Actor, db: Db, page: PageNumber = 1, limit: PageSize = 20):
    require_role(user, Role.ADMIN)
    return paginate(db, select(User).order_by(User.created_at.desc()), page, limit)


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: UUID, data: UserPatch, user: Actor, db: Db):
    require_role(user, Role.ADMIN)
    target = get_or_404(db, User, user_id)
    if target.role == Role.ADMIN:
        raise DomainError("ADMIN_PROTECTED", "Изменение администратора доступно через CLI", 409)
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(target, key, value)
    if data.role == Role.COURIER and not db.get(CourierProfile, target.id):
        db.add(CourierProfile(user_id=target.id))
    db.commit()
    return target


@router.get("/restaurants", response_model=Page[RestaurantOut])
def restaurants(user: Actor, db: Db, page: PageNumber = 1, limit: PageSize = 20):
    require_role(user, Role.ADMIN)
    return paginate(db, select(Restaurant).order_by(Restaurant.created_at.desc()), page, limit)


@router.post("/restaurants", response_model=RestaurantOut, status_code=201)
def create_restaurant(data: RestaurantCreate, user: Actor, db: Db):
    require_role(user, Role.ADMIN)
    return ManagementService(db).create_restaurant(data)


@router.patch("/restaurants/{restaurant_id}", response_model=RestaurantOut)
def moderate(restaurant_id: UUID, data: ModerationPatch, user: Actor, db: Db):
    require_role(user, Role.ADMIN)
    item = get_or_404(db, Restaurant, restaurant_id)
    if data.owner_id:
        owner = get_or_404(db, User, data.owner_id)
        if owner.role != Role.RESTAURANT_OWNER:
            raise DomainError("INVALID_OWNER", "Пользователь должен быть владельцем ресторана", 422)
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(item, key, value)
    db.commit()
    return item


@router.get("/couriers", response_model=Page[CourierOut])
def couriers(user: Actor, db: Db, page: PageNumber = 1, limit: PageSize = 20):
    require_role(user, Role.ADMIN)
    return paginate(
        db, select(CourierProfile).order_by(CourierProfile.created_at.desc()), page, limit
    )


@router.patch("/couriers/{user_id}", response_model=CourierOut)
def approve_courier(user_id: UUID, data: CourierApproval, user: Actor, db: Db):
    require_role(user, Role.ADMIN)
    item = get_or_404(db, CourierProfile, user_id)
    item.is_verified = data.is_verified
    db.commit()
    return item


@router.get("/orders", response_model=Page[OrderOut])
def orders(user: Actor, db: Db, page: PageNumber = 1, limit: PageSize = 20):
    require_role(user, Role.ADMIN)
    return paginate(db, select(Order).order_by(Order.created_at.desc()), page, limit)


@router.get("/reviews", response_model=Page[ReviewOut])
def reviews(user: Actor, db: Db, page: PageNumber = 1, limit: PageSize = 20):
    require_role(user, Role.ADMIN)
    return paginate(db, select(Review).order_by(Review.created_at.desc()), page, limit)


@router.post("/cuisines", response_model=CuisineOut, status_code=201)
def create_cuisine(data: CuisineWrite, user: Actor, db: Db):
    require_role(user, Role.ADMIN)
    item = Cuisine(**data.model_dump())
    db.add(item)
    db.commit()
    return item


@router.patch("/cuisines/{cuisine_id}", response_model=CuisineOut)
def update_cuisine(cuisine_id: UUID, data: CuisineWrite, user: Actor, db: Db):
    require_role(user, Role.ADMIN)
    item = get_or_404(db, Cuisine, cuisine_id)
    for key, value in data.model_dump().items():
        setattr(item, key, value)
    db.commit()
    return item
