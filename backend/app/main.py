import json
import logging
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException

from app.api.v1 import admin, catalog, courier, customer, media, merchant
from app.core.config import get_settings
from app.core.errors import DomainError
from app.db.session import SessionLocal
from app.security.rate_limit import RateLimitMiddleware
from app.security.request_limits import RequestSizeLimitMiddleware

settings = get_settings()
app = FastAPI(
    title="Bishkek Delivery API",
    version="0.1.0",
    docs_url=None if settings.app_env == "production" else "/docs",
    redoc_url=None if settings.app_env == "production" else "/redoc",
    openapi_url=None if settings.app_env == "production" else "/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Request-ID"],
)
app.add_middleware(
    RequestSizeLimitMiddleware,
    max_request_bytes=settings.max_request_bytes,
)
app.add_middleware(
    RateLimitMiddleware,
    enabled=settings.rate_limit_enabled,
    requests_per_minute=settings.rate_limit_requests_per_minute,
    strict_requests_per_minute=settings.rate_limit_strict_requests_per_minute,
    trust_proxy_headers=settings.trust_proxy_headers,
)
logger = logging.getLogger("delivery")
logging.basicConfig(level=logging.INFO, format="%(message)s")


def error_response(code: str, message: str, status: int):
    return JSONResponse({"error": {"code": code, "message": message}}, status_code=status)


@app.exception_handler(DomainError)
async def domain_error(request: Request, exc: DomainError):
    return error_response(exc.code, exc.message, exc.status)


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    return error_response("VALIDATION_ERROR", "Проверьте поля формы", 422)


@app.exception_handler(IntegrityError)
async def integrity_error(request: Request, exc: IntegrityError):
    return error_response("CONFLICT", "Такая запись уже существует или данные связаны", 409)


@app.exception_handler(SQLAlchemyError)
async def database_error(request: Request, exc: SQLAlchemyError):
    return error_response("DATABASE_UNAVAILABLE", "Сервис временно недоступен", 503)


@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException):
    return error_response("HTTP_ERROR", "Запрос недоступен", exc.status_code)


@app.middleware("http")
async def request_logging(request: Request, call_next):
    request_id, started = str(uuid4()), perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        response = error_response("INTERNAL_ERROR", "Не удалось выполнить запрос", 500)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.app_env == "production":
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
        )
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    route = getattr(request.scope.get("route"), "path", "unmatched")
    logger.info(
        json.dumps(
            {
                "request_id": request_id,
                "route": route,
                "method": request.method,
                "status": response.status_code,
                "duration_ms": round((perf_counter() - started) * 1000, 2),
            }
        )
    )
    return response


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok"}


@app.get("/ready", tags=["System"])
def ready():
    with SessionLocal() as db:
        db.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.get("/api/v1/config", tags=["System"])
def public_config():
    return {
        "demo_catalog": settings.demo_catalog,
        "auth_configured": bool(settings.firebase_project_id),
    }


for router in (
    catalog.router,
    customer.router,
    merchant.router,
    courier.router,
    admin.router,
    media.router,
):
    app.include_router(router, prefix="/api/v1")
