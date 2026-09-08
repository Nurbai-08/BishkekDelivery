from uuid import UUID

from fastapi import APIRouter
from sqlalchemy import select

from app.api.v1.catalog import PageNumber, PageSize
from app.dependencies.auth import Actor, Db, require_role
from app.models import CourierProfile, Order, Restaurant
from app.models.enums import OrderStatus, Role
from app.repositories.common import paginate
from app.schemas.common import Page, Schema
from app.schemas.orders import OrderOut, StatusPatch
from app.schemas.users import CourierOut, CourierPatch
from app.services.orders import OrderService

router = APIRouter(prefix="/courier", tags=["Courier"])


class AvailableDelivery(Schema):
    id: UUID
    order_number: str
    restaurant_name: str
    pickup_address: str
    delivery_area: str
    delivery_fee: str


@router.get("/profile", response_model=CourierOut | None)
def profile(user: Actor, db: Db):
    require_role(user, Role.COURIER)
    return db.get(CourierProfile, user.id)


@router.put("/profile", response_model=CourierOut)
def save_profile(data: CourierPatch, user: Actor, db: Db):
    require_role(user, Role.COURIER)
    item = db.get(CourierProfile, user.id)
    if item is None:
        item = CourierProfile(user_id=user.id)
        db.add(item)
    item.vehicle_type = data.vehicle_type
    item.is_online = data.is_online
    db.commit()
    return item


@router.get("/available", response_model=Page[AvailableDelivery])
def available(user: Actor, db: Db, page: PageNumber = 1, limit: PageSize = 20):
    OrderService(db)._verified_courier(user)
    result = paginate(
        db,
        select(Order)
        .where(
            Order.status == OrderStatus.READY_FOR_PICKUP,
            Order.courier_id.is_(None),
        )
        .order_by(Order.created_at),
        page,
        limit,
    )
    restaurant_ids = {order.restaurant_id for order in result["items"]}
    places = {
        place.id: place
        for place in db.scalars(select(Restaurant).where(Restaurant.id.in_(restaurant_ids)))
    }
    # Unassigned couriers receive no customer contact details or apartment numbers.
    result["items"] = [
        {
            "id": order.id,
            "order_number": order.order_number,
            "restaurant_name": order.restaurant_name,
            "pickup_address": places[order.restaurant_id].address_text,
            "delivery_area": order.address_snapshot["street"],
            "delivery_fee": str(order.delivery_fee),
        }
        for order in result["items"]
    ]
    return result


@router.get("/deliveries", response_model=Page[OrderOut])
def deliveries(user: Actor, db: Db, page: PageNumber = 1, limit: PageSize = 20):
    require_role(user, Role.COURIER)
    return paginate(
        db,
        select(Order).where(Order.courier_id == user.id).order_by(Order.created_at.desc()),
        page,
        limit,
    )


@router.post("/deliveries/{order_id}/accept", response_model=OrderOut)
def accept(order_id: UUID, user: Actor, db: Db):
    return OrderService(db).accept_delivery(user, order_id)


@router.patch("/deliveries/{order_id}/status", response_model=OrderOut)
def status(order_id: UUID, data: StatusPatch, user: Actor, db: Db):
    return OrderService(db).transition(user, order_id, data.status, "courier")
