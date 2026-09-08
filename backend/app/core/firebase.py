import os
from functools import lru_cache

import firebase_admin
from firebase_admin import auth, credentials
from firebase_admin.exceptions import FirebaseError
from google.auth.exceptions import DefaultCredentialsError

from app.core.config import get_settings
from app.core.errors import DomainError


@lru_cache
def firebase_app():
    settings = get_settings()
    if not settings.firebase_project_id:
        raise DomainError("AUTH_NOT_CONFIGURED", "Вход ещё не настроен", 503)
    options = {"projectId": settings.firebase_project_id}
    if settings.firebase_auth_emulator_host:
        os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = settings.firebase_auth_emulator_host
        return firebase_admin.initialize_app(options=options)
    if settings.firebase_service_account_file:
        try:
            credential = credentials.Certificate(settings.firebase_service_account_file)
            if credential.project_id != settings.firebase_project_id:
                raise ValueError("Firebase project mismatch")
            return firebase_admin.initialize_app(credential, options)
        except (OSError, ValueError) as exc:
            raise DomainError("AUTH_NOT_CONFIGURED", "Серверный вход ещё не настроен", 503) from exc
    if settings.firebase_private_key:
        credential = credentials.Certificate(
            {
                "type": "service_account",
                "project_id": settings.firebase_project_id,
                "client_email": settings.firebase_client_email,
                "private_key": settings.firebase_private_key.replace("\\n", "\n"),
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )
        return firebase_admin.initialize_app(credential, options)
    return firebase_admin.initialize_app(options=options)


def verify_token(token: str) -> dict:
    app = firebase_app()
    try:
        return auth.verify_id_token(token, app=app, check_revoked=True)
    except DefaultCredentialsError as exc:
        raise DomainError(
            "AUTH_NOT_CONFIGURED", "Серверная проверка входа ещё не настроена", 503
        ) from exc
    except (ValueError, FirebaseError) as exc:
        raise DomainError("INVALID_TOKEN", "Войдите в аккаунт повторно", 401) from exc
