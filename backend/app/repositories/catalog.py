from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import Cuisine, Product, Restaurant
from app.repositories.common import paginate


class CatalogRepository:
    def __init__(self, db: Session):
        self.db = db

    def restaurants(
        self,
        *,
        search="",
        cuisine=None,
        rating=None,
        delivery_time=None,
        sort="popular",
        city_id=None,
        page=1,
        limit=20,
    ):
        query = select(Restaurant).where(Restaurant.is_active, Restaurant.is_verified)
        if city_id:
            query = query.where(Restaurant.city_id == city_id)
        if cuisine:
            query = query.where(Restaurant.cuisines.any(Cuisine.slug == cuisine))
        if search:
            pattern = "%" + search.replace("%", r"\%").replace("_", r"\_") + "%"
            product_match = select(Product.restaurant_id).where(
                Product.name.ilike(pattern),
                Product.is_active,
                Product.is_available,
            )
            query = query.where(
                or_(
                    Restaurant.name.ilike(pattern),
                    Restaurant.id.in_(product_match),
                    Restaurant.cuisines.any(Cuisine.name.ilike(pattern)),
                )
            )
        if rating is not None:
            query = query.where(Restaurant.rating >= rating)
        if delivery_time is not None:
            query = query.where(Restaurant.estimated_delivery_max <= delivery_time)
        sorting = {
            "popular": Restaurant.is_featured.desc(),
            "rating": Restaurant.rating.desc(),
            "delivery": Restaurant.estimated_delivery_max,
            "fee": Restaurant.base_delivery_fee,
        }
        query = query.order_by(Restaurant.is_open.desc(), sorting[sort], Restaurant.id)
        return paginate(self.db, query, page, limit)
