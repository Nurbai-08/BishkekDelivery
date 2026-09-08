"""Real Firebase Auth Emulator + HTTP API + PostgreSQL integration smoke test.

Creates isolated local fixtures; never uses or modifies production accounts.
"""

import json
import sys
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

import httpx
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models import CourierProfile, Restaurant, User
from app.models.enums import Role
from sqlalchemy import select

BASE = "http://127.0.0.1:8000/api/v1"


def request(method, path, token=None, **kwargs):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    response = httpx.request(method, BASE + path, headers=headers, timeout=20, **kwargs)
    if response.status_code >= 400:
        raise RuntimeError(f"{method} {path}: {response.status_code} {response.text}")
    return response.json() if response.content else None


def account(role, suffix):
    email = f"{role.lower()}-{suffix}@example.test"
    password = uuid4().hex + "Aa1!"
    response = httpx.post(
        "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local-only",
        json={"email": email, "password": password, "returnSecureToken": True},
        timeout=10,
    )
    response.raise_for_status()
    identity = response.json()
    request("GET", "/auth/me", identity["idToken"])
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.firebase_uid == identity["localId"]))
        user.role = Role(role)
        user.first_name = "Тестовый " + role.lower()
        if role == "RESTAURANT_OWNER":
            restaurant = db.scalar(
                select(Restaurant).where(Restaurant.slug == "sakura-sushi")
            )
            if not restaurant or not restaurant.is_demo:
                raise RuntimeError(
                    "A fictional Sakura Sushi seed restaurant is required"
                )
            restaurant.owner_id = user.id
        if role == "COURIER":
            db.add(CourierProfile(user_id=user.id, is_verified=True, is_online=True))
        db.commit()
    return {"email": email, "password": password, "token": identity["idToken"]}


def main():
    settings = get_settings()
    if (
        settings.app_env != "development"
        or settings.firebase_project_id != "demo-bishkek"
        or settings.firebase_auth_emulator_host != "127.0.0.1:9099"
    ):
        raise SystemExit(
            "This script requires the local demo-bishkek Firebase Auth Emulator"
        )
    suffix = uuid4().hex[:8]
    accounts = {
        role: account(role, suffix)
        for role in ["CUSTOMER", "RESTAURANT_OWNER", "COURIER", "ADMIN"]
    }
    customer = accounts["CUSTOMER"]["token"]
    owner = accounts["RESTAURANT_OWNER"]["token"]
    courier = accounts["COURIER"]["token"]
    restaurant = request("GET", "/restaurants?search=Sakura")["items"][0]
    product = next(
        item
        for item in request("GET", f"/restaurants/{restaurant['id']}/menu")["products"]
        if item["slug"] == "philadelphia"
    )
    address = request(
        "POST",
        "/addresses",
        customer,
        json={
            "city_id": restaurant["city_id"],
            "street": "Тестовая улица",
            "house": "1",
        },
    )
    cart = {
        "restaurant_id": restaurant["id"],
        "items": [{"product_id": product["id"], "quantity": 2}],
    }
    quote = request("POST", "/cart/validate", json=cart)
    payload = {
        **cart,
        "delivery_address_id": address["id"],
        "contact_phone": "+996555000000",
        "payment_method": "CASH",
        "idempotency_key": str(uuid4()),
        "expected_total": quote["total"],
    }
    order = request("POST", "/orders", customer, json=payload)
    oid = order["id"]
    assert request("POST", "/orders", customer, json=payload)["id"] == oid
    for status in ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP"]:
        request(
            "PATCH", f"/merchant/orders/{oid}/status", owner, json={"status": status}
        )
    request("POST", f"/courier/deliveries/{oid}/accept", courier)
    for status in ["PICKED_UP", "DELIVERING", "DELIVERED"]:
        request(
            "PATCH",
            f"/courier/deliveries/{oid}/status",
            courier,
            json={"status": status},
        )
    final = request("GET", f"/orders/{oid}", customer)
    assert final["status"] == "DELIVERED" and len(final["history"]) == 8
    request(
        "POST",
        "/reviews",
        customer,
        json={
            "order_id": oid,
            "rating": 5,
            "comment": "Тестовый отзыв — проверка доставки",
        },
    )
    path = ROOT / ".local" / "test-accounts.json"
    path.write_text(
        json.dumps(
            {
                role: {key: item[key] for key in ("email", "password")}
                for role, item in accounts.items()
            },
            indent=2,
        )
    )
    path.chmod(0o600)
    print(
        "PASS: Firebase signup -> verified API identity -> checkout -> merchant -> courier -> delivered -> review"
    )
    print("Local browser test accounts saved in .local/test-accounts.json")


if __name__ == "__main__":
    main()
