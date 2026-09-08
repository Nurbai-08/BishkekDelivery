import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.security.rate_limit import RateLimitMiddleware
from app.security.request_limits import RequestSizeLimitMiddleware


def test_rate_limit_returns_headers_and_429():
    app = FastAPI()
    app.add_middleware(
        RateLimitMiddleware,
        enabled=True,
        requests_per_minute=2,
        strict_requests_per_minute=1,
    )

    @app.get("/api/v1/ping")
    def ping():
        return {"ok": True}

    client = TestClient(app)
    first = client.get("/api/v1/ping")
    second = client.get("/api/v1/ping")
    third = client.get("/api/v1/ping")

    assert first.status_code == 200
    assert second.headers["X-RateLimit-Remaining"] == "0"
    assert third.status_code == 429
    assert third.headers["Retry-After"] == "60"


def test_rate_limit_skips_non_api_paths():
    app = FastAPI()
    app.add_middleware(
        RateLimitMiddleware,
        enabled=True,
        requests_per_minute=1,
        strict_requests_per_minute=1,
    )

    @app.get("/health")
    def health():
        return {"ok": True}

    client = TestClient(app)
    assert client.get("/health").status_code == 200
    assert client.get("/health").status_code == 200


def test_production_settings_require_tls_and_rate_limit():
    common = {
        "app_env": "production",
        "frontend_url": "https://delivery.example",
        "firebase_project_id": "delivery-project",
        "firebase_service_account_file": "",
        "firebase_client_email": "",
        "firebase_private_key": "",
        "demo_catalog": False,
        "rate_limit_enabled": True,
    }
    with pytest.raises(ValueError, match="TLS"):
        Settings(database_url="postgresql+psycopg://delivery:secret@db/delivery", **common)

    settings = Settings(
        database_url="postgresql+psycopg://delivery:secret@db/delivery?sslmode=require",
        **common,
    )
    assert settings.app_env == "production"


def test_request_size_limit_rejects_large_content_length():
    app = FastAPI()
    app.add_middleware(RequestSizeLimitMiddleware, max_request_bytes=10)

    @app.post("/upload")
    def upload():
        return {"ok": True}

    response = TestClient(app).post("/upload", content=b"01234567890")
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "REQUEST_TOO_LARGE"
