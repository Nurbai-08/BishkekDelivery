from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class ProviderImage:
    reference: str
    attribution: list[dict[str, str]]
    source: str


class ImageProvider(Protocol):
    def photos(self, place_id: str) -> list[ProviderImage]: ...
