from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.core.firebase import verify_token
from app.db.session import get_db
from app.models import User
from app.models.enums import Role

Db = Annotated[Session, Depends(get_db)]
bearer = HTTPBearer(auto_error=False)


def current_user(
    db: Db,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> User:
    if not credentials:
        raise DomainError("UNAUTHENTICATED", "Войдите в аккаунт", 401)
    claims = verify_token(credentials.credentials)
    uid = claims["uid"]
    user = db.scalar(select(User).where(User.firebase_uid == uid))
    if not user:
        db.execute(
            insert(User)
            .values(
                firebase_uid=uid,
                email=claims.get("email"),
                first_name=(claims.get("name") or "")[:100],
            )
            .on_conflict_do_nothing(index_elements=[User.firebase_uid])
        )
        db.commit()
        user = db.scalar(select(User).where(User.firebase_uid == uid))
    if not user or user.is_blocked or not user.is_active:
        raise DomainError("ACCOUNT_BLOCKED", "Аккаунт заблокирован", 403)
    return user


Actor = Annotated[User, Depends(current_user)]


def require_role(user: User, *roles: Role):
    if user.role not in roles:
        raise DomainError("FORBIDDEN", "Недостаточно прав", 403)
