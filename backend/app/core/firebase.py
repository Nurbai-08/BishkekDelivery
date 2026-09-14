import base64
import json
import os
from functools import lru_cache
from time import time

import firebase_admin
import httpx
from firebase_admin import auth, credentials
from firebase_admin.exceptions import FirebaseError
from google.auth.exceptions import DefaultCredentialsError

from app.core.config import get_settings
from app.core.errors import DomainError

FIREBASE_ACCOUNT_LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup"


def _has_explicit_admin_credentials(settings) -> bool:
    return bool(
        settings.firebase_auth_emulator_host
        or settings.firebase_service_account_file
        or (settings.firebase_client_email and settings.firebase_private_key)
    )


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


def _decode_token_payload(token: str) -> dict:
    try:
        encoded = token.split(".")[1]
        padding = "=" * (-len(encoded) % 4)
        payload = json.loads(base64.urlsafe_b64decode(encoded + padding))
    except (IndexError, UnicodeDecodeError, ValueError, json.JSONDecodeError) as exc:
        raise DomainError("INVALID_TOKEN", "Войдите в аккаунт повторно", 401) from exc
    if not isinstance(payload, dict):
        raise DomainError("INVALID_TOKEN", "Войдите в аккаунт повторно", 401)
    return payload


def _verify_token_with_web_api(token: str, settings) -> dict:
    try:
        response = httpx.post(
            FIREBASE_ACCOUNT_LOOKUP_URL,
            params={"key": settings.firebase_web_api_key},
            json={"idToken": token},
            timeout=5,
        )
    except httpx.RequestError as exc:
        raise DomainError("AUTH_UNAVAILABLE", "Сервис входа временно недоступен", 503) from exc
    if response.status_code >= 500:
        raise DomainError("AUTH_UNAVAILABLE", "Сервис входа временно недоступен", 503)
    if response.status_code != 200:
        raise DomainError("INVALID_TOKEN", "Войдите в аккаунт повторно", 401)

    users = response.json().get("users", [])
    if not users or users[0].get("disabled"):
        raise DomainError("INVALID_TOKEN", "Войдите в аккаунт повторно", 401)
    account = users[0]
    payload = _decode_token_payload(token)
    try:
        token_is_current = int(payload["auth_time"]) >= int(account.get("validSince", 0))
    except (KeyError, TypeError, ValueError) as exc:
        raise DomainError("INVALID_TOKEN", "Войдите в аккаунт повторно", 401) from exc
    if (
        not token_is_current
        or payload.get("sub") != account.get("localId")
        or payload.get("aud") != settings.firebase_project_id
        or payload.get("iss")
        != f"https://securetoken.google.com/{settings.firebase_project_id}"
        or not isinstance(payload.get("exp"), int)
        or payload["exp"] <= time()
    ):
        raise DomainError("INVALID_TOKEN", "Войдите в аккаунт повторно", 401)
    return {
        "uid": account["localId"],
        "email": account.get("email"),
        "name": account.get("displayName"),
    }


def verify_token(token: str) -> dict:
    settings = get_settings()
    if settings.firebase_web_api_key and not _has_explicit_admin_credentials(settings):
        return _verify_token_with_web_api(token, settings)
    app = firebase_app()
    try:
        return auth.verify_id_token(token, app=app, check_revoked=True)
    except DefaultCredentialsError as exc:
        raise DomainError(
            "AUTH_NOT_CONFIGURED", "Серверная проверка входа ещё не настроена", 503
        ) from exc
    except (ValueError, FirebaseError) as exc:
        raise DomainError("INVALID_TOKEN", "Войдите в аккаунт повторно", 401) from exc
