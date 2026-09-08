from decimal import Decimal

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.models import Address, City, Order, Restaurant, Review, User
from app.models.enums import OrderStatus
from app.repositories.common import get_or_404
from app.schemas.orders import ReviewCreate
from app.schemas.users import AddressWrite


class CustomerService:
    def __init__(self, db: Session):
        self.db = db

    def save_address(self, user: User, data: AddressWrite, address: Address | None = None):
        city = get_or_404(self.db, City, data.city_id)
        if not city.is_active:
            raise DomainError("CITY_UNAVAILABLE", "Город доставки недоступен", 409)
        self.db.scalar(select(User).where(User.id == user.id).with_for_update())
        if data.is_default:
            self.db.execute(
                update(Address).where(Address.user_id == user.id).values(is_default=False)
            )
        if address is None:
            count = self.db.scalar(
                select(func.count()).select_from(Address).where(Address.user_id == user.id)
            )
            if count >= 20:
                raise DomainError("ADDRESS_LIMIT", "Можно сохранить до 20 адресов", 409)
            address = Address(user_id=user.id, **data.model_dump())
            self.db.add(address)
        else:
            if address.user_id != user.id:
                raise DomainError("FORBIDDEN", "Нет доступа к адресу", 403)
            for key, value in data.model_dump().items():
                setattr(address, key, value)
        self.db.commit()
        return address

    def review(self, user: User, data: ReviewCreate):
        order = get_or_404(self.db, Order, data.order_id)
        if order.customer_id != user.id or order.status != OrderStatus.DELIVERED:
            raise DomainError(
                "REVIEW_NOT_ALLOWED", "Отзыв доступен после доставки своего заказа", 403
            )
        restaurant = self.db.scalar(
            select(Restaurant)
            .where(
                Restaurant.id == order.restaurant_id,
            )
            .with_for_update()
        )
        if self.db.scalar(select(Review.id).where(Review.order_id == order.id)):
            raise DomainError("REVIEW_EXISTS", "Вы уже оставили отзыв", 409)
        review = Review(
            **data.model_dump(),
            user_id=user.id,
            restaurant_id=restaurant.id,
            author_name=user.first_name or "Покупатель",
        )
        self.db.add(review)
        self.db.flush()
        rating, count = self.db.execute(
            select(func.avg(Review.rating), func.count(Review.id)).where(
                Review.restaurant_id == restaurant.id
            )
        ).one()
        restaurant.rating = Decimal(rating).quantize(Decimal("0.01"))
        restaurant.review_count = count
        self.db.commit()
        return review
