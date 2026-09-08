from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.core.errors import DomainError
from app.dependencies.auth import Db
from app.models import City, Cuisine, MenuCategory, Product, Restaurant, Review
from app.repositories.catalog import CatalogRepository
from app.repositories.common import get_or_404, paginate
from app.schemas.catalog import CuisineOut, MenuOut, ProductOut, RestaurantOut
from app.schemas.common import Page
from app.schemas.orders import ReviewOut
from app.schemas.users import CityOut

router = APIRouter(tags=["Catalog"])
PageNumber = Annotated[int, Query(ge=1)]
PageSize = Annotated[int, Query(ge=1, le=100)]


@router.get("/cities", response_model=list[CityOut])
def cities(db: Db):
    return db.scalars(select(City).where(City.is_active).limit(100)).all()


@router.get("/cuisines", response_model=list[CuisineOut])
def cuisines(db: Db):
    return db.scalars(
        select(Cuisine).where(Cuisine.is_active).order_by(Cuisine.sort_order).limit(100)
    ).all()


@router.get("/restaurants", response_model=Page[RestaurantOut])
def restaurants(
    db: Db,
    search: str = Query(default="", max_length=100),
    cuisine: str | None = None,
    rating: float | None = Query(default=None, ge=0, le=5),
    delivery_time: int | None = Query(default=None, ge=1, le=180),
    sort: Literal["popular", "rating", "delivery", "fee"] = "popular",
    city_id: UUID | None = None,
    page: PageNumber = 1,
    limit: PageSize = 20,
):
    return CatalogRepository(db).restaurants(
        search=search,
        cuisine=cuisine,
        rating=rating,
        delivery_time=delivery_time,
        sort=sort,
        city_id=city_id,
        page=page,
        limit=limit,
    )


@router.get("/cuisines/{slug}/restaurants", response_model=Page[RestaurantOut])
def cuisine_restaurants(slug: str, db: Db, page: PageNumber = 1, limit: PageSize = 20):
    return CatalogRepository(db).restaurants(cuisine=slug, page=page, limit=limit)


@router.get("/restaurants/{restaurant_id}", response_model=RestaurantOut)
def restaurant(restaurant_id: UUID, db: Db):
    item = get_or_404(db, Restaurant, restaurant_id)
    if not item.is_active or not item.is_verified:
        raise DomainError("NOT_FOUND", "Ресторан не найден", 404)
    return item


@router.get("/restaurants/{restaurant_id}/menu", response_model=MenuOut)
def menu(restaurant_id: UUID, db: Db):
    restaurant(restaurant_id, db)
    categories = db.scalars(
        select(MenuCategory)
        .where(
            MenuCategory.restaurant_id == restaurant_id,
            MenuCategory.is_active,
        )
        .order_by(MenuCategory.sort_order)
        .limit(100)
    ).all()
    products = db.scalars(
        select(Product)
        .where(
            Product.restaurant_id == restaurant_id,
            Product.is_active,
            Product.menu_category_id.in_([category.id for category in categories]),
        )
        .order_by(Product.is_featured.desc(), Product.name)
        .limit(500)
    ).all()
    return {"categories": categories, "products": products}


@router.get("/restaurants/{restaurant_id}/reviews", response_model=Page[ReviewOut])
def reviews(restaurant_id: UUID, db: Db, page: PageNumber = 1, limit: PageSize = 20):
    restaurant(restaurant_id, db)
    return paginate(
        db,
        select(Review)
        .where(Review.restaurant_id == restaurant_id)
        .order_by(Review.created_at.desc()),
        page,
        limit,
    )


@router.get("/products/{product_id}", response_model=ProductOut)
def product(product_id: UUID, db: Db):
    item = get_or_404(db, Product, product_id)
    restaurant(item.restaurant_id, db)
    if not item.is_active:
        raise DomainError("NOT_FOUND", "Блюдо не найдено", 404)
    return item
