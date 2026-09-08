from functools import lru_cache
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://delivery:delivery@localhost:5432/delivery"
    frontend_url: str = "http://localhost:5173"
    firebase_project_id: str = ""
    firebase_client_email: str = ""
    firebase_private_key: str = ""
    firebase_service_account_file: str = ""
    firebase_auth_emulator_host: str = ""
    r2_endpoint: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""
    r2_public_url: str = ""
    google_places_api_key: str = ""
    demo_catalog: bool = False
    rate_limit_enabled: bool = False
    rate_limit_requests_per_minute: int = 120
    rate_limit_strict_requests_per_minute: int = 20
    trust_proxy_headers: bool = False
    max_request_bytes: int = 7_000_000

    @model_validator(mode="after")
    def validate_environment(self):
        if self.app_env == "production":
            if self.firebase_auth_emulator_host:
                raise ValueError("Firebase emulator is forbidden in production")
            if not self.firebase_project_id or not self.frontend_url.startswith("https://"):
                raise ValueError("Production requires Firebase and an HTTPS frontend origin")
            if self.demo_catalog:
                raise ValueError("Demo catalog must be disabled in production")
            if not self.rate_limit_enabled:
                raise ValueError("Rate limiting must be enabled in production")
            if self.firebase_service_account_file and not Path(
                self.firebase_service_account_file
            ).is_file():
                raise ValueError("Firebase service account file does not exist")
        if bool(self.firebase_client_email) != bool(self.firebase_private_key):
            raise ValueError("Firebase client email and private key must be provided together")
        if self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql+psycopg://", 1)
        elif self.database_url.startswith("postgresql://"):
            self.database_url = self.database_url.replace(
                "postgresql://", "postgresql+psycopg://", 1
            )
        if not self.database_url.startswith("postgresql+psycopg://"):
            raise ValueError("A PostgreSQL database with psycopg is required")
        if self.app_env == "production":
            query = parse_qs(urlsplit(self.database_url).query)
            sslmodes = query.get("sslmode", [])
            if not sslmodes or sslmodes[0] not in {"require", "verify-ca", "verify-full"}:
                raise ValueError("Production PostgreSQL must use TLS via sslmode")
        if (
            self.rate_limit_requests_per_minute < 1
            or self.rate_limit_strict_requests_per_minute < 1
        ):
            raise ValueError("Rate limit values must be positive")
        if self.rate_limit_strict_requests_per_minute > self.rate_limit_requests_per_minute:
            raise ValueError("Strict rate limit cannot exceed the general rate limit")
        if self.max_request_bytes < 1:
            raise ValueError("Maximum request size must be positive")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
