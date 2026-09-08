from uuid import uuid4

from app.core.errors import DomainError
from app.models import Restaurant, User
from app.models.enums import Role


def test_auth_required(client):
    assert client.get("/health").json() == {"status": "ok"}
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"


def test_firebase_verification_and_blocking(client, db, monkeypatch):
    from app.dependencies import auth

    def reject(token):
        raise DomainError("INVALID_TOKEN", "Invalid", 401)

    monkeypatch.setattr(auth, "verify_token", reject)
    assert (
        client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid"}).status_code
        == 401
    )
    uid = str(uuid4())
    monkeypatch.setattr(
        auth, "verify_token", lambda token: {"uid": uid, "email": "test@example.com"}
    )
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer verified"})
    assert response.status_code == 200
    assert response.json()["role"] == "CUSTOMER"
    from sqlalchemy import select

    user = db.scalar(select(User).where(User.firebase_uid == uid))
    user.is_blocked = True
    db.commit()
    assert (
        client.get("/api/v1/auth/me", headers={"Authorization": "Bearer verified"}).status_code
        == 403
    )


def test_catalog_search_pagination_visibility(client, catalog, db):
    result = client.get(
        f"/api/v1/restaurants?search=Филадельфия&limit=1&city_id={catalog['city'].id}"
    ).json()
    assert result["total"] == 1
    assert result["items"][0]["id"] == str(catalog["restaurant"].id)
    catalog["restaurant"].is_verified = False
    db.commit()
    assert client.get(f"/api/v1/restaurants/{catalog['restaurant'].id}/menu").status_code == 404
    assert client.get("/api/v1/restaurants?limit=1000").status_code == 422


def test_owner_cannot_modify_another_restaurant(client, catalog, login, db):
    outsider = User(firebase_uid=str(uuid4()), role=Role.RESTAURANT_OWNER)
    db.add(outsider)
    db.commit()
    login(outsider)
    response = client.patch(f"/api/v1/merchant/products/{catalog['product'].id}", json={"price": 1})
    assert response.status_code == 403
    login(catalog["owner"])
    assert (
        client.patch(
            f"/api/v1/merchant/products/{catalog['product'].id}", json={"price": 490}
        ).status_code
        == 200
    )


def test_cross_restaurant_cart(client, catalog, order_payload, db):
    other = Restaurant(
        city_id=catalog["city"].id, name="Other", slug=str(uuid4()), is_verified=True
    )
    db.add(other)
    db.commit()
    response = client.post(
        "/api/v1/cart/validate",
        json={
            "restaurant_id": str(other.id),
            "items": order_payload["items"],
        },
    )
    assert response.status_code == 409
