from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.models import Restaurant, RestaurantMember, User
from app.models.enums import Role


def merchant_restaurant_ids(user: User):
    membership = select(RestaurantMember.restaurant_id).where(RestaurantMember.user_id == user.id)
    return select(Restaurant.id).where(
        or_(Restaurant.owner_id == user.id, Restaurant.id.in_(membership))
    )


def owns_restaurant(db: Session, user: User, restaurant_id: UUID) -> bool:
    return bool(db.scalar(merchant_restaurant_ids(user).where(Restaurant.id == restaurant_id)))


def require_merchant(db: Session, user: User, restaurant_id: UUID):
    if user.role != Role.RESTAURANT_OWNER or not owns_restaurant(db, user, restaurant_id):
        raise DomainError("FORBIDDEN", "Нет доступа к этому ресторану", 403)
