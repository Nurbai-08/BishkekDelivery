from io import BytesIO
from uuid import uuid4

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import get_settings
from app.core.errors import DomainError

MAX_BYTES = 5 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 20_000_000


class R2Storage:
    def upload_image(self, data: bytes, prefix: str) -> str:
        settings = get_settings()
        if not all(
            (
                settings.r2_endpoint,
                settings.r2_access_key_id,
                settings.r2_secret_access_key,
                settings.r2_bucket_name,
                settings.r2_public_url,
            )
        ):
            raise DomainError(
                "STORAGE_NOT_CONFIGURED", "Хранилище фотографий ещё не настроено", 503
            )
        content = normalize_image(data)
        key = f"{prefix}/{uuid4().hex}.webp"
        client = boto3.client(
            "s3",
            endpoint_url=settings.r2_endpoint,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name="auto",
        )
        try:
            client.put_object(
                Bucket=settings.r2_bucket_name,
                Key=key,
                Body=content,
                ContentType="image/webp",
                CacheControl="public,max-age=31536000,immutable",
            )
        except (BotoCoreError, ClientError) as exc:
            raise DomainError(
                "STORAGE_UNAVAILABLE", "Не удалось сохранить фотографию", 503
            ) from exc
        return f"{settings.r2_public_url.rstrip('/')}/{key}"


def normalize_image(data: bytes) -> bytes:
    if len(data) > MAX_BYTES:
        raise DomainError("IMAGE_TOO_LARGE", "Размер фотографии — до 5 МБ", 413)
    try:
        with Image.open(BytesIO(data)) as image:
            if image.format not in {"JPEG", "PNG", "WEBP"}:
                raise DomainError("INVALID_IMAGE", "Загрузите JPEG, PNG или WebP", 422)
            image.load()
            normalized = ImageOps.exif_transpose(image).convert("RGB")
            normalized.thumbnail((1600, 1600))
            output = BytesIO()
            normalized.save(output, "WEBP", quality=85)
            return output.getvalue()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise DomainError("INVALID_IMAGE", "Файл не является допустимой фотографией", 422) from exc
