from uuid import uuid4

import pytest


def create(client, login, catalog, payload):
    login(catalog["customer"])
    response = client.post("/api/v1/orders", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_full_order_flow_and_review(client, login, catalog, order_payload):
    order = create(client, login, catalog, order_payload)
    assert order["total"] == "940.00"
    assert order["items"][0]["unit_price"] == "420.00"
    oid = order["id"]
    login(catalog["owner"])
    for status in ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP"]:
        response = client.patch(f"/api/v1/merchant/orders/{oid}/status", json={"status": status})
        assert response.status_code == 200, response.text
    login(catalog["courier"])
    available = client.get("/api/v1/courier/available").json()["items"]
    assert available and "contact_phone" not in available[0]
    assert client.post(f"/api/v1/courier/deliveries/{oid}/accept").status_code == 200
    for status in ["PICKED_UP", "DELIVERING", "DELIVERED"]:
        response = client.patch(f"/api/v1/courier/deliveries/{oid}/status", json={"status": status})
        assert response.status_code == 200, response.text
    login(catalog["customer"])
    final = client.get(f"/api/v1/orders/{oid}").json()
    assert final["status"] == "DELIVERED"
    assert len(final["history"]) == 8
    assert final["payment_status"] == "PAID"
    review = {"order_id": oid, "rating": 5, "comment": "Вкусно!"}
    assert client.post("/api/v1/reviews", json=review).status_code == 201
    assert client.post("/api/v1/reviews", json=review).status_code == 409
    place = client.get(f"/api/v1/restaurants/{catalog['restaurant'].id}").json()
    assert place["rating"] == "5.00" and place["review_count"] == 1


def test_checkout_idempotency_and_snapshot(client, login, catalog, order_payload, db):
    first = create(client, login, catalog, order_payload)
    assert create(client, login, catalog, order_payload)["id"] == first["id"]
    catalog["product"].price = 990
    catalog["product"].name = "Updated dish"
    catalog["address"].street = "Другой адрес"
    db.commit()
    saved = client.get(f"/api/v1/orders/{first['id']}").json()
    assert saved["total"] == "940.00"
    assert saved["items"][0]["product_name"] == "Филадельфия"
    assert saved["address_snapshot"]["street"] == "Чуй"
    order_payload["customer_comment"] = "different"
    assert client.post("/api/v1/orders", json=order_payload).status_code == 409


@pytest.mark.parametrize(
    "change,code",
    [
        ({"expected_total": "1.00"}, 409),
        ({"total": "1.00"}, 422),
        ({"contact_phone": "bad"}, 422),
        ({"payment_method": "ONLINE"}, 422),
    ],
)
def test_checkout_rejects_tampering(client, login, catalog, order_payload, change, code):
    login(catalog["customer"])
    assert client.post("/api/v1/orders", json=order_payload | change).status_code == code


def test_changed_price_requires_review(client, login, catalog, order_payload, db):
    login(catalog["customer"])
    catalog["product"].price = 490
    db.commit()
    response = client.post("/api/v1/orders", json=order_payload)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "PRICE_CHANGED"


def test_wrong_address_and_unavailable_product(client, login, catalog, order_payload, db):
    login(catalog["stranger"])
    assert client.post("/api/v1/orders", json=order_payload).status_code == 403
    login(catalog["customer"])
    catalog["product"].is_available = False
    db.commit()
    assert client.post("/api/v1/orders", json=order_payload).status_code == 409


def test_quantity_duplicate_products_and_minimum(client, catalog, order_payload, db):
    payload = {key: order_payload[key] for key in ("restaurant_id", "items")}
    payload["items"][0]["quantity"] = 0
    assert client.post("/api/v1/cart/validate", json=payload).status_code == 422
    payload["items"][0]["quantity"] = 1
    payload["items"] *= 2
    assert client.post("/api/v1/cart/validate", json=payload).status_code == 422
    payload["items"] = payload["items"][:1]
    catalog["restaurant"].minimum_order = 1000
    db.commit()
    assert client.post("/api/v1/cart/validate", json=payload).status_code == 409


def test_permissions_and_illegal_transitions(client, login, catalog, order_payload):
    order = create(client, login, catalog, order_payload)
    oid = order["id"]
    assert client.post("/api/v1/reviews", json={"order_id": oid, "rating": 5}).status_code == 403
    login(catalog["stranger"])
    assert client.get(f"/api/v1/orders/{oid}").status_code == 404
    assert client.post(f"/api/v1/orders/{oid}/cancel").status_code == 403
    assert client.get("/api/v1/admin/users").status_code == 403
    assert (
        client.patch(
            f"/api/v1/merchant/orders/{oid}/status", json={"status": "CONFIRMED"}
        ).status_code
        == 403
    )
    login(catalog["owner"])
    assert (
        client.patch(
            f"/api/v1/merchant/orders/{oid}/status", json={"status": "DELIVERED"}
        ).status_code
        == 409
    )
    login(catalog["courier"])
    assert client.post(f"/api/v1/courier/deliveries/{oid}/accept").status_code == 409


def test_customer_can_only_cancel_pending(client, login, catalog, order_payload):
    order = create(client, login, catalog, order_payload)
    response = client.post(f"/api/v1/orders/{order['id']}/cancel")
    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"
    assert client.post(f"/api/v1/orders/{order['id']}/cancel").status_code == 409


def test_missing_product(client, login, catalog, order_payload):
    login(catalog["customer"])
    order_payload["items"][0]["product_id"] = str(uuid4())
    assert client.post("/api/v1/orders", json=order_payload).status_code == 409
