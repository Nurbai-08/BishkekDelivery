"""Small, dependency-free request limiter for the API edge.

This protects a single application instance from accidental abuse. Production
deployments should also enforce limits at the load balancer/API gateway so the
limit is shared across replicas.
"""

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        *,
        enabled: bool,
        requests_per_minute: int,
        strict_requests_per_minute: int,
        trust_proxy_headers: bool = False,
    ):
        super().__init__(app)
        self.enabled = enabled
        self.requests_per_minute = requests_per_minute
        self.strict_requests_per_minute = strict_requests_per_minute
        self.trust_proxy_headers = trust_proxy_headers
        self._requests: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def _client_key(self, request: Request) -> str:
        if self.trust_proxy_headers:
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                return forwarded.split(",", 1)[0].strip()
        return request.client.host if request.client else "unknown"

    def _limit_for(self, request: Request) -> int:
        path = request.url.path
        strict_path = path in {
            "/api/v1/auth/sync",
            "/api/v1/cart/validate",
            "/api/v1/orders",
        } or (
            path.startswith("/api/v1/merchant/products/") and path.endswith("/image")
        )
        if request.method in {"POST", "PUT", "PATCH", "DELETE"} and strict_path:
            return self.strict_requests_per_minute
        return self.requests_per_minute

    def _check(self, key: tuple[str, str], limit: int, now: float) -> tuple[bool, int]:
        window_start = now - 60
        with self._lock:
            bucket = self._requests[key]
            while bucket and bucket[0] <= window_start:
                bucket.popleft()
            if len(self._requests) > 10_000:
                stale = [
                    bucket_key
                    for bucket_key, bucket_values in self._requests.items()
                    if bucket_key != key
                    and (not bucket_values or bucket_values[-1] <= window_start)
                ]
                for stale_key in stale:
                    self._requests.pop(stale_key, None)
            if len(bucket) >= limit:
                return False, 0
            bucket.append(now)
            return True, max(0, limit - len(bucket))

    async def dispatch(self, request: Request, call_next) -> Response:
        if (
            not self.enabled
            or request.method == "OPTIONS"
            or not request.url.path.startswith("/api/")
        ):
            return await call_next(request)

        limit = self._limit_for(request)
        allowed, remaining = self._check(
            (self._client_key(request), request.url.path), limit, monotonic()
        )
        if not allowed:
            response = JSONResponse(
                {"error": {"code": "RATE_LIMITED", "message": "Слишком много запросов"}},
                status_code=429,
                headers={"Retry-After": "60"},
            )
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = "0"
            return response

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
