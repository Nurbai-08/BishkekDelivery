from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.models import City, Cuisine, Restaurant, User
from app.models.enums import Role
from app.repositories.common import get_or_404
from app.schemas.management import RestaurantCreate


class ManagementService:
    def __init__(self, db: Session):
        self.db = db

    def create_restaurant(self, data: RestaurantCreate):
        city = get_or_404(self.db, City, data.city_id)
        owner = get_or_404(self.db, User, data.owner_id)
        if owner.role != Role.RESTAURANT_OWNER or owner.is_blocked or not city.is_active:
            raise DomainError("INVALID_RESTAURANT", "Проверьте город и владельца ресторана", 422)
        cuisines = self.db.scalars(
            select(Cuisine).where(
                Cuisine.id.in_(data.cuisine_ids),
                Cuisine.is_active,
            )
        ).all()
        if len(cuisines) != len(set(data.cuisine_ids)):
            raise DomainError("INVALID_CUISINES", "Выберите активные кухни", 422)
        item = Restaurant(
            **data.model_dump(exclude={"cuisine_ids"}),
            cuisines=cuisines,
            is_open=False,
            is_verified=False,
        )
        self.db.add(item)
        self.db.commit()
        return item
