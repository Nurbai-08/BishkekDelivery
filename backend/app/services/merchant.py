from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.models import MenuCategory, Product, User
from app.repositories.common import get_or_404
from app.schemas.catalog import ProductPatch, ProductWrite
from app.services.permissions import require_merchant


class MerchantService:
    def __init__(self, db: Session):
        self.db = db

    def create_product(self, user: User, data: ProductWrite):
        require_merchant(self.db, user, data.restaurant_id)
        category = get_or_404(self.db, MenuCategory, data.menu_category_id)
        if category.restaurant_id != data.restaurant_id or not category.is_active:
            raise DomainError("INVALID_CATEGORY", "Выберите категорию этого ресторана", 422)
        product = Product(**data.model_dump())
        self.db.add(product)
        self.db.commit()
        return product

    def update_product(self, user: User, product: Product, data: ProductPatch):
        require_merchant(self.db, user, product.restaurant_id)
        for key, value in data.model_dump(exclude_none=True).items():
            setattr(product, key, value)
        self.db.commit()
        return product
