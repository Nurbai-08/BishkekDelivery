from io import BytesIO

import pytest
from PIL import Image

from app.core.errors import DomainError
from app.services.images.storage import normalize_image


def test_image_is_validated_and_resized():
    source = BytesIO()
    Image.new("RGB", (2000, 1000), "red").save(source, "PNG")
    result = normalize_image(source.getvalue())
    with Image.open(BytesIO(result)) as image:
        assert image.format == "WEBP"
        assert image.size == (1600, 800)


def test_invalid_image_is_rejected():
    with pytest.raises(DomainError) as caught:
        normalize_image(b"<svg onload='alert(1)'></svg>")
    assert caught.value.code == "INVALID_IMAGE"
