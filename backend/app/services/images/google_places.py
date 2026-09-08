import re

import httpx

from app.core.config import get_settings
from app.core.errors import DomainError
from app.services.images.provider import ProviderImage


class GooglePlacesProvider:
    def photos(self, place_id: str) -> list[ProviderImage]:
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,300}", place_id):
            raise DomainError("INVALID_PLACE", "Некорректный идентификатор места", 422)
        key = get_settings().google_places_api_key
        if not key:
            raise DomainError("PROVIDER_NOT_CONFIGURED", "Google Places не настроен", 503)
        try:
            response = httpx.get(
                f"https://places.googleapis.com/v1/places/{place_id}",
                headers={"X-Goog-Api-Key": key, "X-Goog-FieldMask": "photos"},
                timeout=10,
            )
            response.raise_for_status()
            return [
                ProviderImage(
                    reference=photo["name"],
                    attribution=photo.get("authorAttributions", []),
                    source="GOOGLE_PLACES",
                )
                for photo in response.json().get("photos", [])[:10]
            ]
        except (httpx.HTTPError, ValueError, KeyError) as exc:
            raise DomainError(
                "IMAGE_PROVIDER_UNAVAILABLE", "Не удалось получить фотографии", 502
            ) from exc
