import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import current_user
from app.main import app
from app.models import Address, City, CourierProfile, MenuCategory, Product, Restaurant, User
from app.models.enums import Role


@pytest.fixture
def db():
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.fail("TEST_DATABASE_URL must point to a migrated disposable PostgreSQL database")
    engine = create_engine(url)
    with engine.connect() as connection:
        transaction = connection.begin()
        session = Session(
            bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
        )
        yield session
        session.close()
        transaction.rollback()
    engine.dispose()


@pytest.fixture
def catalog(db):
    customer = User(firebase_uid=str(uuid4()), first_name="Айжан", role=Role.CUSTOMER)
    owner = User(firebase_uid=str(uuid4()), role=Role.RESTAURANT_OWNER)
    courier = User(firebase_uid=str(uuid4()), role=Role.COURIER)
    stranger = User(firebase_uid=str(uuid4()), role=Role.CUSTOMER)
    admin = User(firebase_uid=str(uuid4()), role=Role.ADMIN)
    city = City(name=str(uuid4()), country="Kyrgyzstan", timezone="Asia/Bishkek")
    db.add_all([customer, owner, courier, stranger, admin, city])
    db.flush()
    restaurant = Restaurant(
        city_id=city.id,
        owner_id=owner.id,
        name="Test kitchen",
        slug=str(uuid4()),
        is_verified=True,
        base_delivery_fee=100,
    )
    db.add(restaurant)
    db.flush()
    category = MenuCategory(restaurant_id=restaurant.id, name="Роллы", slug="rolls")
    db.add(category)
    db.flush()
    product = Product(
        restaurant_id=restaurant.id,
        menu_category_id=category.id,
        name="Филадельфия",
        slug="philadelphia",
        price=420,
    )
    address = Address(user_id=customer.id, city_id=city.id, street="Чуй", house="12")
    profile = CourierProfile(user_id=courier.id, is_verified=True, is_online=True)
    db.add_all([product, address, profile])
    db.commit()
    return {
        "customer": customer,
        "owner": owner,
        "courier": courier,
        "stranger": stranger,
        "admin": admin,
        "city": city,
        "restaurant": restaurant,
        "product": product,
        "address": address,
        "category": category,
    }


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def login():
    def set_user(user):
        app.dependency_overrides[current_user] = lambda: user

    return set_user


@pytest.fixture
def order_payload(catalog):
    return {
        "restaurant_id": str(catalog["restaurant"].id),
        "items": [{"product_id": str(catalog["product"].id), "quantity": 2}],
        "delivery_address_id": str(catalog["address"].id),
        "contact_phone": "+996555123456",
        "payment_method": "CASH",
        "idempotency_key": str(uuid4()),
        "expected_total": "940.00",
    }
