from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid", str_strip_whitespace=True)


class Page[T](BaseModel):
    items: list[T]
    page: int
    page_size: int
    total: int
    pages: int


class IdSchema(Schema):
    id: UUID


class DatedSchema(IdSchema):
    created_at: datetime
