from math import ceil

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import DomainError


def paginate(db: Session, statement, page: int = 1, limit: int = 20) -> dict:
    total = db.scalar(select(func.count()).select_from(statement.order_by(None).subquery())) or 0
    items = db.scalars(statement.limit(limit).offset((page - 1) * limit)).unique().all()
    return {
        "items": items,
        "page": page,
        "page_size": limit,
        "total": total,
        "pages": ceil(total / limit),
    }


def get_or_404(db: Session, model, identity):
    item = db.get(model, identity)
    if item is None:
        raise DomainError("NOT_FOUND", "Запись не найдена", 404)
    return item
