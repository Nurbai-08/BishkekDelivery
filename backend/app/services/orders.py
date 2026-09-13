import hashlib
from datetime import timedelta
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import DomainError
from app.db.base import now
from app.models import (
    Address,
    CourierDelivery,
    CourierProfile,
    Order,
    OrderItem,
    OrderStatusHistory,
    User,
)
from app.models.enums import OrderStatus as S
from app.models.enums import Role
from app.repositories.common import get_or_404
from app.schemas.orders import OrderCreate
from app.services.cart import CartService
from app.services.permissions import owns_restaurant, require_merchant

MERCHANT_TRANSITIONS = {
    S.PENDING: S.CONFIRMED,
    S.CONFIRMED: S.PREPARING,
    S.PREPARING: S.READY_FOR_PICKUP,
}
COURIER_TRANSITIONS = {
    S.COURIER_ASSIGNED: S.PICKED_UP,
    S.PICKED_UP: S.DELIVERING,
    S.DELIVERING: S.DELIVERED,
}
DEMO_TRACKING_TRANSITIONS = (
    S.CONFIRMED,
    S.PREPARING,
    S.READY_FOR_PICKUP,
    S.COURIER_ASSIGNED,
    S.PICKED_UP,
    S.DELIVERING,
    S.DELIVERED,
)
DEMO_TRACKING_STEP_SECONDS = 15


class OrderService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user: User, payload: OrderCreate) -> Order:
        if user.role != Role.CUSTOMER:
            raise DomainError("FORBIDDEN", "Заказы оформляются из аккаунта покупателя", 403)
        # Serialize checkout retries for one customer, including concurrent first requests.
        self.db.scalar(select(User).where(User.id == user.id).with_for_update())
        fingerprint = hashlib.sha256(payload.model_dump_json().encode()).hexdigest()
        existing = self.db.scalar(
            select(Order).where(
                Order.customer_id == user.id,
                Order.idempotency_key == payload.idempotency_key,
            )
        )
        if existing:
            if existing.request_fingerprint != fingerprint:
                raise DomainError(
                    "IDEMPOTENCY_CONFLICT", "Повтор запроса содержит другие данные", 409
                )
            return existing
        address = get_or_404(self.db, Address, payload.delivery_address_id)
        if address.user_id != user.id:
            raise DomainError("FORBIDDEN", "Адрес принадлежит другому пользователю", 403)
        restaurant, quote = CartService(self.db).quote(payload, lock=True)
        if address.city_id != restaurant.city_id:
            raise DomainError("OUTSIDE_DELIVERY_AREA", "Адрес вне города доставки", 409)
        if payload.expected_total != quote.total:
            raise DomainError(
                "PRICE_CHANGED", "Цены изменились. Проверьте сумму и повторите заказ", 409
            )
        snapshot = {
            key: str(getattr(address, key))
            for key in (
                "label",
                "street",
                "house",
                "apartment",
                "entrance",
                "floor",
                "comment",
            )
        }
        order = Order(
            id=uuid4(),
            order_number="BD-" + uuid4().hex[:16].upper(),
            customer_id=user.id,
            restaurant_id=restaurant.id,
            restaurant_name=restaurant.name,
            delivery_address_id=address.id,
            address_snapshot=snapshot,
            contact_phone=payload.contact_phone,
            status=S.PENDING,
            subtotal=quote.subtotal,
            delivery_fee=quote.delivery_fee,
            total=quote.total,
            payment_method=payload.payment_method,
            customer_comment=payload.customer_comment,
            idempotency_key=payload.idempotency_key,
            request_fingerprint=fingerprint,
        )
        order.items = [OrderItem(**line.model_dump()) for line in quote.items]
        order.history = [OrderStatusHistory(to_status=S.PENDING, changed_by_user_id=user.id)]
        self.db.add(order)
        self.db.commit()
        return order

    def readable(self, user: User, order_id: UUID) -> Order:
        order = get_or_404(self.db, Order, order_id)
        allowed = (
            user.role == Role.ADMIN
            or order.customer_id == user.id
            or (user.role == Role.COURIER and order.courier_id == user.id)
            or (
                user.role == Role.RESTAURANT_OWNER
                and owns_restaurant(self.db, user, order.restaurant_id)
            )
        )
        if not allowed:
            raise DomainError("NOT_FOUND", "Заказ не найден", 404)
        self._advance_demo_tracking(order, user)
        return order

    def _advance_demo_tracking(self, order: Order, user: User):
        """Advance local demo orders every 15 seconds without changing real workflows."""
        if not get_settings().demo_order_tracking or order.status == S.CANCELLED:
            return
        status_step = {S.PENDING: 0} | {
            status: index for index, status in enumerate(DEMO_TRACKING_TRANSITIONS, start=1)
        }
        current_step = status_step.get(order.status)
        if current_step is None:
            return
        elapsed_seconds = max(0, (now() - order.created_at).total_seconds())
        target_step = min(
            len(DEMO_TRACKING_TRANSITIONS), int(elapsed_seconds // DEMO_TRACKING_STEP_SECONDS)
        )
        for step in range(current_step + 1, target_step + 1):
            scheduled_at = order.created_at + timedelta(seconds=step * DEMO_TRACKING_STEP_SECONDS)
            self._apply_status(order, user, DEMO_TRACKING_TRANSITIONS[step - 1], scheduled_at)

    def transition(self, user: User, order_id: UUID, target: S, actor: str) -> Order:
        order = self._locked(order_id)
        if actor == "merchant":
            require_merchant(self.db, user, order.restaurant_id)
            valid = MERCHANT_TRANSITIONS.get(order.status) == target
        elif actor == "courier":
            self._verified_courier(user)
            if order.courier_id != user.id:
                raise DomainError("FORBIDDEN", "Заказ назначен другому курьеру", 403)
            valid = COURIER_TRANSITIONS.get(order.status) == target
        else:
            if order.customer_id != user.id:
                raise DomainError("FORBIDDEN", "Нет доступа к этому заказу", 403)
            valid = order.status == S.PENDING and target == S.CANCELLED
        if not valid:
            raise DomainError("INVALID_STATUS_TRANSITION", "Этот переход статуса недоступен", 409)
        self._apply_status(order, user, target)
        return order

    def accept_delivery(self, user: User, order_id: UUID) -> Order:
        profile = self._verified_courier(user)
        if not profile.is_online:
            raise DomainError("COURIER_OFFLINE", "Сначала выйдите на линию", 409)
        order = self._locked(order_id)
        if order.status != S.READY_FOR_PICKUP or order.courier_id:
            raise DomainError("DELIVERY_TAKEN", "Заказ больше недоступен", 409)
        order.courier_id = user.id
        self.db.add(CourierDelivery(order_id=order.id, courier_id=user.id))
        self._apply_status(order, user, S.COURIER_ASSIGNED)
        return order

    def _verified_courier(self, user: User) -> CourierProfile:
        profile = self.db.get(CourierProfile, user.id)
        if user.role != Role.COURIER or not profile or not profile.is_verified:
            raise DomainError("COURIER_NOT_APPROVED", "Дождитесь одобрения администратора", 403)
        return profile

    def _locked(self, order_id: UUID) -> Order:
        order = self.db.scalar(select(Order).where(Order.id == order_id).with_for_update())
        if not order:
            raise DomainError("NOT_FOUND", "Заказ не найден", 404)
        return order

    def _apply_status(self, order: Order, user: User, target: S, changed_at=None):
        changed_at = changed_at or now()
        order.history.append(
            OrderStatusHistory(
                from_status=order.status,
                to_status=target,
                changed_by_user_id=user.id,
                created_at=changed_at,
            )
        )
        order.status = target
        if target == S.CONFIRMED:
            order.confirmed_at = changed_at
        if target == S.DELIVERED:
            order.delivered_at = changed_at
            order.payment_status = "PAID"
            delivery = self.db.scalar(
                select(CourierDelivery).where(CourierDelivery.order_id == order.id)
            )
            if delivery:
                delivery.completed_at = now()
        if target == S.CANCELLED:
            order.cancelled_at = now()
        self.db.commit()
