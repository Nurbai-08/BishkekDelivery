from uuid import UUID

from fastapi import APIRouter, UploadFile

from app.dependencies.auth import Actor, Db
from app.models import Product
from app.models.enums import ImageSource
from app.repositories.common import get_or_404
from app.schemas.catalog import ProductOut
from app.services.images.storage import MAX_BYTES, R2Storage
from app.services.permissions import require_merchant

router = APIRouter(tags=["Media"])


@router.post("/merchant/products/{product_id}/image", response_model=ProductOut)
def upload_product(product_id: UUID, file: UploadFile, user: Actor, db: Db):
    product = get_or_404(db, Product, product_id)
    require_merchant(db, user, product.restaurant_id)
    data = file.file.read(MAX_BYTES + 1)
    product.image_url = R2Storage().upload_image(
        data, f"products/{product.restaurant_id}/{product.id}"
    )
    product.image_source = ImageSource.RESTAURANT_UPLOAD
    product.image_attribution = "Фото ресторана"
    db.commit()
    return product
