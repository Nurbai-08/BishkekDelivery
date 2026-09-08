from uuid import UUID

from fastapi import APIRouter, Response
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert

from app.api.v1.catalog import PageNumber, PageSize, restaurant
from app.dependencies.auth import Actor, Db
from app.models import Address, Favorite, Order, Restaurant
from app.models.enums import OrderStatus
from app.repositories.common import get_or_404, paginate
from app.schemas.catalog import RestaurantOut
from app.schemas.common import Page
from app.schemas.orders import CartInput, OrderCreate, OrderOut, Quote, ReviewCreate, ReviewOut
from app.schemas.users import AddressOut, AddressWrite, ProfilePatch, UserOut
from app.services.cart import CartService
from app.services.customer import CustomerService
from app.services.orders import OrderService

router = APIRouter(tags=["Customer"])


@router.get("/auth/me", response_model=UserOut)
@router.post("/auth/sync", response_model=UserOut)
def me(user: Actor):
    return user


@router.post("/auth/logout", status_code=204)
def logout(user: Actor):
    # Authentication is stateless; the Firebase client clears its local session.
    return Response(status_code=204)


@router.patch("/users/me", response_model=UserOut)
def update_profile(data: ProfilePatch, user: Actor, db: Db):
    for key, value in data.model_dump().items():
        setattr(user, key, value)
    db.commit()
    return user


@router.get("/addresses", response_model=list[AddressOut])
def addresses(user: Actor, db: Db):
    return db.scalars(
        select(Address)
        .where(Address.user_id == user.id)
        .order_by(Address.is_default.desc(), Address.created_at)
        .limit(20)
    ).all()


@router.post("/addresses", response_model=AddressOut, status_code=201)
def create_address(data: AddressWrite, user: Actor, db: Db):
    return CustomerService(db).save_address(user, data)


@router.patch("/addresses/{address_id}", response_model=AddressOut)
def update_address(address_id: UUID, data: AddressWrite, user: Actor, db: Db):
    return CustomerService(db).save_address(user, data, get_or_404(db, Address, address_id))


@router.get("/favorites", response_model=Page[RestaurantOut])
def favorites(user: Actor, db: Db, page: PageNumber = 1, limit: PageSize = 20):
    return paginate(
        db,
        select(Restaurant)
        .join(Favorite)
        .where(
            Favorite.user_id == user.id,
            Restaurant.is_active,
            Restaurant.is_verified,
        )
        .order_by(Favorite.created_at.desc()),
        page,
        limit,
    )


@router.put("/favorites/{restaurant_id}", status_code=204)
def favorite(restaurant_id: UUID, user: Actor, db: Db):
    restaurant(restaurant_id, db)
    db.execute(
        insert(Favorite)
        .values(user_id=user.id, restaurant_id=restaurant_id)
        .on_conflict_do_nothing()
    )
    db.commit()
    return Response(status_code=204)


@router.delete("/favorites/{restaurant_id}", status_code=204)
def unfavorite(restaurant_id: UUID, user: Actor, db: Db):
    db.execute(
        delete(Favorite).where(Favorite.user_id == user.id, Favorite.restaurant_id == restaurant_id)
    )
    db.commit()
    return Response(status_code=204)


@router.post("/cart/validate", response_model=Quote)
def quote(data: CartInput, db: Db):
    return CartService(db).quote(data)[1]


@router.post("/orders", response_model=OrderOut, status_code=201)
def create_order(data: OrderCreate, user: Actor, db: Db):
    return OrderService(db).create(user, data)


@router.get("/orders/me", response_model=Page[OrderOut])
def my_orders(user: Actor, db: Db, page: PageNumber = 1, limit: PageSize = 20):
    return paginate(
        db,
        select(Order).where(Order.customer_id == user.id).order_by(Order.created_at.desc()),
        page,
        limit,
    )


@router.get("/orders/{order_id}", response_model=OrderOut)
def order(order_id: UUID, user: Actor, db: Db):
    return OrderService(db).readable(user, order_id)


@router.post("/orders/{order_id}/cancel", response_model=OrderOut)
def cancel_order(order_id: UUID, user: Actor, db: Db):
    return OrderService(db).transition(user, order_id, OrderStatus.CANCELLED, "customer")


@router.post("/reviews", response_model=ReviewOut, status_code=201)
def create_review(data: ReviewCreate, user: Actor, db: Db):
    return CustomerService(db).review(user, data)
