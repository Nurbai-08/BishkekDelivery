from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.models import City, MenuCategory, Product, Restaurant
from app.repositories.common import get_or_404
from app.schemas.orders import CartInput, Quote, QuoteLine


class CartService:
    def __init__(self, db: Session):
        self.db = db

    def quote(self, payload: CartInput, *, lock=False) -> tuple[Restaurant, Quote]:
        query = select(Restaurant).where(Restaurant.id == payload.restaurant_id)
        restaurant = self.db.scalar(query.with_for_update() if lock else query)
        if not restaurant or not restaurant.is_active or not restaurant.is_verified:
            raise DomainError("RESTAURANT_UNAVAILABLE", "Ресторан недоступен", 404)
        city = get_or_404(self.db, City, restaurant.city_id)
        if not restaurant.is_open or not city.is_active:
            raise DomainError("RESTAURANT_CLOSED", "Ресторан сейчас закрыт", 409)
        query = select(Product).where(Product.id.in_([item.product_id for item in payload.items]))
        products = {p.id: p for p in self.db.scalars(query.with_for_update() if lock else query)}
        categories = set(
            self.db.scalars(
                select(MenuCategory.id).where(
                    MenuCategory.restaurant_id == restaurant.id,
                    MenuCategory.is_active,
                )
            )
        )
        lines = []
        for item in payload.items:
            product = products.get(item.product_id)
            if (
                not product
                or product.restaurant_id != restaurant.id
                or not product.is_active
                or not product.is_available
                or product.menu_category_id not in categories
            ):
                raise DomainError("PRODUCT_UNAVAILABLE", "Одно из блюд больше недоступно", 409)
            lines.append(
                QuoteLine(
                    product_id=product.id,
                    product_name=product.name,
                    product_image_url=product.image_url,
                    unit_price=Decimal(product.price).quantize(Decimal("0.01")),
                    quantity=item.quantity,
                    total_price=Decimal(product.price * item.quantity).quantize(Decimal("0.01")),
                )
            )
        subtotal = sum((line.total_price for line in lines), Decimal("0"))
        if subtotal < restaurant.minimum_order:
            raise DomainError(
                "MINIMUM_ORDER", f"Минимальный заказ: {restaurant.minimum_order} сом", 409
            )
        return restaurant, Quote(
            items=lines,
            subtotal=subtotal,
            delivery_fee=Decimal(restaurant.base_delivery_fee).quantize(Decimal("0.01")),
            total=subtotal + restaurant.base_delivery_fee,
        )
