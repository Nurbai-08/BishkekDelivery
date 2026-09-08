from uuid import UUID

from fastapi import APIRouter, Response
from sqlalchemy import select

from app.api.v1.catalog import PageNumber, PageSize
from app.dependencies.auth import Actor, Db, require_role
from app.models import MenuCategory, Order, Product, Restaurant
from app.models.enums import Role
from app.repositories.common import get_or_404, paginate
from app.schemas.catalog import (
    CategoryOut,
    CategoryWrite,
    MenuOut,
    ProductOut,
    ProductPatch,
    ProductWrite,
    RestaurantOut,
    RestaurantPatch,
)
from app.schemas.common import Page
from app.schemas.orders import OrderOut, StatusPatch
from app.services.merchant import MerchantService
from app.services.orders import OrderService
from app.services.permissions import merchant_restaurant_ids, require_merchant

router = APIRouter(prefix="/merchant", tags=["Merchant"])


@router.get("/restaurants/{restaurant_id}/menu", response_model=MenuOut)
def menu(restaurant_id: UUID, user: Actor, db: Db):
    require_merchant(db, user, restaurant_id)
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
        )
        .order_by(Product.name)
        .limit(500)
    ).all()
    return {"categories": categories, "products": products}


@router.get("/restaurants", response_model=Page[RestaurantOut])
def restaurants(user: Actor, db: Db, page: PageNumber = 1, limit: PageSize = 20):
    require_role(user, Role.RESTAURANT_OWNER)
    return paginate(
        db,
        select(Restaurant)
        .where(Restaurant.id.in_(merchant_restaurant_ids(user)))
        .order_by(Restaurant.name),
        page,
        limit,
    )


@router.patch("/restaurants/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant(restaurant_id: UUID, data: RestaurantPatch, user: Actor, db: Db):
    require_merchant(db, user, restaurant_id)
    item = get_or_404(db, Restaurant, restaurant_id)
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(item, key, value)
    db.commit()
    return item


@router.get("/orders", response_model=Page[OrderOut])
def orders(user: Actor, db: Db, page: PageNumber = 1, limit: PageSize = 20):
    require_role(user, Role.RESTAURANT_OWNER)
    return paginate(
        db,
        select(Order)
        .where(Order.restaurant_id.in_(merchant_restaurant_ids(user)))
        .order_by(Order.created_at.desc()),
        page,
        limit,
    )


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def status(order_id: UUID, data: StatusPatch, user: Actor, db: Db):
    return OrderService(db).transition(user, order_id, data.status, "merchant")


@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(data: CategoryWrite, user: Actor, db: Db):
    require_merchant(db, user, data.restaurant_id)
    item = MenuCategory(**data.model_dump())
    db.add(item)
    db.commit()
    return item


@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(data: ProductWrite, user: Actor, db: Db):
    return MerchantService(db).create_product(user, data)


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: UUID, data: ProductPatch, user: Actor, db: Db):
    return MerchantService(db).update_product(user, get_or_404(db, Product, product_id), data)


@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: UUID, user: Actor, db: Db):
    item = get_or_404(db, Product, product_id)
    require_merchant(db, user, item.restaurant_id)
    item.is_active = False
    db.commit()
    return Response(status_code=204)
