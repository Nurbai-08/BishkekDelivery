from uuid import uuid4

from app.models import Cuisine


def test_admin_can_create_and_approve_restaurant(client, login, catalog, db):
    cuisine = Cuisine(name="Test cuisine", slug=str(uuid4()))
    db.add(cuisine)
    db.commit()
    data = {
        "city_id": str(catalog["city"].id),
        "owner_id": str(catalog["owner"].id),
        "name": "New kitchen",
        "slug": "kitchen-" + uuid4().hex,
        "address_text": "Test street, 1",
        "phone": "+996555000000",
        "cuisine_ids": [str(cuisine.id)],
    }
    login(catalog["customer"])
    assert client.post("/api/v1/admin/restaurants", json=data).status_code == 403
    login(catalog["admin"])
    response = client.post("/api/v1/admin/restaurants", json=data)
    assert response.status_code == 201, response.text
    rid = response.json()["id"]
    assert client.get(f"/api/v1/restaurants/{rid}").status_code == 404
    login(catalog["owner"])
    assert client.get(f"/api/v1/merchant/restaurants/{rid}/menu").status_code == 200
    login(catalog["admin"])
    assert (
        client.patch(f"/api/v1/admin/restaurants/{rid}", json={"is_verified": True}).status_code
        == 200
    )
    assert client.get(f"/api/v1/restaurants/{rid}").status_code == 200


def test_courier_approval_is_required(client, login, catalog, order_payload, db):
    from app.models import CourierProfile

    profile = db.get(CourierProfile, catalog["courier"].id)
    profile.is_verified = False
    db.commit()
    login(catalog["courier"])
    assert client.get("/api/v1/courier/available").status_code == 403


def test_production_rejects_auth_emulator(monkeypatch):
    import pytest
    from pydantic import ValidationError

    from app.core.config import Settings

    with pytest.raises(ValidationError):
        Settings(app_env="production", firebase_auth_emulator_host="127.0.0.1:9099")
