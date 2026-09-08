"""Idempotent fictional catalog. Never seed identities or passwords."""

from decimal import Decimal

from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models import City, Cuisine, MenuCategory, Product, Restaurant
from app.models.enums import ImageSource

PHOTOS = {
    "sushi": (2098085, "https://www.pexels.com/photo/sushi-dish-2098085/"),
    "pizza": (315755, "https://www.pexels.com/photo/pizza-315755/"),
    "burger": (1639557, "https://www.pexels.com/photo/burger-1639557/"),
    "nomad": (1640777, "https://www.pexels.com/photo/food-1640777/"),
    "chicken": (2338407, "https://www.pexels.com/photo/chicken-2338407/"),
    "coffee": (312418, "https://www.pexels.com/photo/coffee-312418/"),
    "georgian": (18330961, "https://www.pexels.com/photo/georgian-khachapuri-with-egg-18330961/"),
    "mexican": (15434316, "https://www.pexels.com/photo/tacos-served-in-a-restaurant-15434316/"),
    "indian": (29684990, "https://www.pexels.com/photo/spicy-indian-curry-in-traditional-kadai-29684990/"),
    "bakery": (14929940, "https://www.pexels.com/photo/pastries-on-display-in-bakery-14929940/"),
}

# Product illustrations use Pexels' free-to-use stock photos. They are deliberately
# kept at the product level so a restaurant can replace any illustration with its
# own photo from the merchant cabinet later.
PRODUCT_PHOTOS = {
    "philadelphia": (5713760, "https://www.pexels.com/photo/sushi-rolls-on-a-plate-5713760/"),
    "california": (4725576, "https://www.pexels.com/photo/maki-californian-sushi-rolls-4725576/"),
    "tempura": (35017916, "https://www.pexels.com/photo/delicious-tempura-sushi-roll-with-sauce-35017916/"),
    "sakura-set": (2323391, "https://www.pexels.com/photo/assorted-sushi-rolls-on-plate-2323391/"),
    "margherita": (14590497, "https://www.pexels.com/photo/photo-of-margherita-pizza-14590497/"),
    "pepperoni": (5175567, "https://www.pexels.com/photo/pizza-with-pepperoni-and-cheese-5175567/"),
    "four-cheese": (19328876, "https://www.pexels.com/photo/four-cheese-pizza-with-spinach-and-sun-dried-tomatoes-19328876/"),
    "bbq-chicken": (29839587, "https://www.pexels.com/photo/delicious-bbq-chicken-pizza-on-wooden-table-29839587/"),
    "classic": (2874979, "https://www.pexels.com/photo/hamburger-with-cheese-2874979/"),
    "double": (5948790, "https://www.pexels.com/photo/close-up-shot-of-a-burger-5948790/"),
    "chicken": (7963093, "https://www.pexels.com/photo/photograph-of-a-chicken-burger-7963093/"),
    "veggie": (20722041, "https://www.pexels.com/photo/burger-with-vegetables-20722041/"),
    "plov": (10522937, "https://www.pexels.com/photo/a-plate-of-rice-with-meat-and-vegetables-on-side-10522937/"),
    "manty": (17243554, "https://www.pexels.com/photo/manti-dumplings-on-a-white-plate-17243554/"),
    "lagman": (27126848, "https://www.pexels.com/photo/bowl-of-noodles-27126848/"),
    "salad": (14457213, "https://www.pexels.com/photo/photo-of-fresh-salad-14457213/"),
    "wings": (35017892, "https://www.pexels.com/photo/barbecue-chicken-wings-and-potato-wedges-in-pan-35017892/"),
    "strips": (8739088, "https://www.pexels.com/photo/fried-food-in-white-ceramic-plate-8739088/"),
    "wrap": (36989888, "https://www.pexels.com/photo/delicious-chicken-wraps-with-crispy-fries-36989888/"),
    "combo": (14661492, "https://www.pexels.com/photo/chicken-wings-and-fries-14661492/"),
    "latte": (531761, "https://www.pexels.com/photo/selective-focus-photography-of-coffee-latte-531761/"),
    "cappuccino": (20184907, "https://www.pexels.com/photo/cappuccino-with-decoration-20184907/"),
    "cheesecake": (1126359, "https://www.pexels.com/photo/cheesecake-1126359/"),
    "croissant": (3850349, "https://www.pexels.com/photo/croissant-3850349/"),
    "khachapuri": (18330961, "https://www.pexels.com/photo/georgian-khachapuri-with-egg-18330961/"),
    "khinkali": (7474078, "https://www.pexels.com/photo/close-up-of-georgian-dumplings-7474078/"),
    "lobio": (37121072, "https://www.pexels.com/photo/top-view-of-rice-dish-with-beans-on-black-plate-37121072/"),
    "ojakhuri": (28128833, "https://www.pexels.com/photo/a-plate-of-food-with-a-meat-and-potatoes-on-it-28128833/"),
    "tacos": (15434316, "https://www.pexels.com/photo/tacos-served-in-a-restaurant-15434316/"),
    "burrito": (27365296, "https://www.pexels.com/photo/mexican-restaurant-27365296/"),
    "quesadilla": (13243944, "https://www.pexels.com/photo/quesadilla-on-a-white-plate-13243944/"),
    "nachos": (5848726, "https://www.pexels.com/photo/close-up-photo-of-nachos-dipped-in-sauce-5848726/"),
    "curry": (29684990, "https://www.pexels.com/photo/spicy-indian-curry-in-traditional-kadai-29684990/"),
    "tikka": (20446401, "https://www.pexels.com/photo/traditional-indian-dish-on-a-grey-table-with-spices-20446401/"),
    "biryani": (7340936, "https://www.pexels.com/photo/close-up-photo-of-a-biryani-dish-7340936/"),
    "samosa": (37068875, "https://www.pexels.com/photo/freshly-made-samosas-in-catering-tray-37068875/"),
    "cinnamon-roll": (3951306, "https://www.pexels.com/photo/cinnamon-rolls-3951306/"),
    "danish": (19499026, "https://www.pexels.com/photo/danish-pastry-with-maple-syrup-and-walnuts-19499026/"),
    "brioche": (26584414, "https://www.pexels.com/photo/close-up-of-fluffy-brioche-buns-26584414/"),
    "cookie": (9712236, "https://www.pexels.com/photo/chocolate-chip-cookies-on-flat-surface-9712236/"),
}
CATALOG = [
    (
        "sakura-sushi",
        "Sakura Sushi",
        "Японская",
        "sushi",
        "Роллы и сеты",
        30,
        45,
        120,
        "Свежие роллы, тёплые встречи. Маленькая Япония в большом городе.",
        [
            ("philadelphia", "Филадельфия", "Лосось, сливочный сыр, рис и огурец", 420, 260),
            ("california", "Калифорния", "Краб, авокадо, огурец и икра тобико", 390, 240),
            ("tempura", "Темпура ролл", "Хрустящая креветка, сыр и соус унаги", 450, 280),
            (
                "sakura-set",
                "Сет Sakura",
                "Филадельфия, Калифорния и темпура. 24 кусочка",
                1190,
                780,
            ),
        ],
    ),
    (
        "fire-pizza",
        "Fire Pizza",
        "Итальянская",
        "pizza",
        "Пицца",
        25,
        35,
        90,
        "Тонкое тесто, щедрая начинка и тот самый румяный бортик.",
        [
            ("margherita", "Маргарита", "Томаты, моцарелла и свежий базилик", 490, 450),
            ("pepperoni", "Пепперони", "Пикантная пепперони и двойная моцарелла", 590, 500),
            ("four-cheese", "Четыре сыра", "Моцарелла, дорблю, пармезан и чеддер", 650, 480),
            ("bbq-chicken", "BBQ Chicken", "Курица, красный лук и дымный соус BBQ", 620, 520),
        ],
    ),
    (
        "bish-burger",
        "Bish Burger",
        "Американская",
        "burger",
        "Бургеры",
        20,
        30,
        80,
        "Сочный бургер без лишних слов. Собираем каждый после заказа.",
        [
            ("classic", "Bish Classic", "Говядина, чеддер, томат и фирменный соус", 320, 280),
            ("double", "Double Bish", "Две говяжьи котлеты, двойной сыр", 450, 380),
            ("chicken", "Криспи чикен", "Хрустящая курица, салат и соус ранч", 290, 270),
            ("veggie", "Зелёный бургер", "Овощная котлета, авокадо и свежие овощи", 330, 260),
        ],
    ),
    (
        "nomad-kitchen",
        "Nomad Kitchen",
        "Кыргызская",
        "nomad",
        "Основные блюда",
        30,
        45,
        100,
        "Гостеприимство в каждом блюде. Знакомые вкусы и сезонные продукты.",
        [
            ("plov", "Плов по-домашнему", "Рис, говядина, морковь и ароматная зира", 350, 400),
            ("manty", "Манты с говядиной", "Ручная лепка, сочная говядина и лук, 5 шт.", 320, 350),
            ("lagman", "Гуйру лагман", "Тянутая лапша, мясо и обжаренные овощи", 380, 450),
            ("salad", "Свежий салат", "Сезонные овощи, зелень и лёгкая заправка", 190, 200),
        ],
    ),
    (
        "chicken-lab",
        "Chicken Lab",
        "Фастфуд",
        "chicken",
        "Курица",
        20,
        30,
        80,
        "Хрустящая снаружи, сочная внутри. Курица, которую хочется разделить.",
        [
            ("wings", "Крылышки BBQ", "Шесть крылышек в фирменной глазури", 350, 300),
            ("strips", "Куриные стрипсы", "Нежное филе в хрустящей панировке", 290, 250),
            ("wrap", "Чикен-ролл", "Курица, овощи и чесночный соус в лаваше", 250, 280),
            ("combo", "Комбо на двоих", "Стрипсы, крылышки, картофель и два соуса", 790, 800),
        ],
    ),
    (
        "coffee-yard",
        "Coffee Yard",
        "Кофе и десерты",
        "coffee",
        "Кофе и десерты",
        15,
        25,
        70,
        "Немного замедлиться. Спешелти кофе и десерты для маленькой паузы.",
        [
            ("latte", "Латте", "Двойной эспрессо и нежная молочная пенка", 190, 300),
            ("cappuccino", "Капучино", "Баланс эспрессо, молока и бархатной пены", 170, 250),
            ("cheesecake", "Чизкейк", "Сливочный десерт на песочной основе", 250, 150),
            ("croissant", "Круассан", "Слоёный, воздушный, на сливочном масле", 150, 90),
        ],
    ),
    (
        "tbilisi-table",
        "Tbilisi Table",
        "Грузинская",
        "georgian",
        "Грузинские блюда",
        30,
        45,
        100,
        "Хачапури, хинкали и тёплое гостеприимство грузинской кухни.",
        [
            (
                "khachapuri",
                "Хачапури по-аджарски",
                "Лодочка из теста, сыр сулугуни и яйцо",
                390,
                350,
            ),
            ("khinkali", "Хинкали", "Сочные хинкали с говядиной и зеленью, 5 шт.", 360, 400),
            ("lobio", "Лобио", "Красная фасоль, кинза, специи и свежий хлеб", 280, 300),
            ("ojakhuri", "Оджахури", "Запечённый картофель, свинина и зелень", 420, 450),
        ],
    ),
    (
        "taco-loco",
        "Taco Loco",
        "Мексиканская",
        "mexican",
        "Мексиканская кухня",
        25,
        40,
        100,
        "Яркая мексиканская кухня с сочной начинкой и домашней сальсой.",
        [
            (
                "tacos",
                "Тако с курицей",
                "Три кукурузные тортильи, курица, авокадо и сальса",
                360,
                320,
            ),
            ("burrito", "Буррито с говядиной", "Тортилья, говядина, фасоль, рис и сыр", 420, 380),
            ("quesadilla", "Кесадилья", "Хрустящая тортилья, курица и расплавленный сыр", 350, 280),
            (
                "nachos",
                "Начос с гуакамоле",
                "Кукурузные чипсы, сыр, гуакамоле и халапеньо",
                290,
                220,
            ),
        ],
    ),
    (
        "curry-house",
        "Curry House",
        "Индийская",
        "indian",
        "Индийская кухня",
        35,
        50,
        110,
        "Пряные карри, ароматный рис и рецепты с разных уголков Индии.",
        [
            (
                "curry",
                "Butter Chicken",
                "Курица в сливочно-томатном соусе с индийскими специями",
                450,
                380,
            ),
            (
                "tikka",
                "Chicken Tikka",
                "Курица в йогуртовом маринаде, запечённая с пряностями",
                430,
                320,
            ),
            ("biryani", "Бирьяни", "Ароматный рис басмати, курица и шафран", 390, 400),
            ("samosa", "Самоса", "Хрустящие пирожки с картофелем и специями, 2 шт.", 190, 160),
        ],
    ),
    (
        "bread-butter",
        "Bread & Butter",
        "Выпечка",
        "bakery",
        "Выпечка",
        15,
        25,
        70,
        "Свежая выпечка, тёплый хлеб и маленькие сладкие радости.",
        [
            (
                "cinnamon-roll",
                "Синнабон",
                "Мягкая булочка с корицей и сливочной глазурью",
                180,
                150,
            ),
            ("danish", "Слойка с вишней", "Хрустящее тесто и вишнёвая начинка", 160, 120),
            ("brioche", "Бриошь", "Нежная сдобная булочка на сливочном масле", 140, 100),
            ("cookie", "Печенье с шоколадом", "Рассыпчатое печенье с кусочками шоколада", 120, 90),
        ],
    ),
]


def photo_url(key: str):
    return f"https://images.pexels.com/photos/{PHOTOS[key][0]}/pexels-photo-{PHOTOS[key][0]}.jpeg?auto=compress&cs=tinysrgb&w=960"


def product_photo(slug: str):
    photo = PRODUCT_PHOTOS.get(slug)
    if not photo:
        return "", ImageSource.SYSTEM, ""
    photo_id, source = photo
    return (
        f"https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg?auto=compress&cs=tinysrgb&w=960",
        ImageSource.PEXELS,
        f"Pexels · {source} · Иллюстрация блюда",
    )


def seed():
    if not get_settings().demo_catalog:
        raise SystemExit("Set DEMO_CATALOG=true explicitly to seed fictional restaurants")
    with SessionLocal() as db:
        city = db.scalar(select(City).where(City.name == "Bishkek"))
        if not city:
            city = City(name="Bishkek", country="Kyrgyzstan", timezone="Asia/Bishkek")
            db.add(city)
            db.flush()
        for index, row in enumerate(CATALOG):
            slug, name, cuisine_name, key, category_name, low, high, fee, description, menu = row
            cuisine = db.scalar(select(Cuisine).where(Cuisine.slug == key))
            if not cuisine:
                cuisine = Cuisine(
                    name=cuisine_name, slug=key, image_url=photo_url(key), sort_order=index
                )
                db.add(cuisine)
            restaurant = db.scalar(select(Restaurant).where(Restaurant.slug == slug))
            if restaurant:
                # Backfill only empty demo images; never overwrite a restaurant upload.
                products = db.scalars(
                    select(Product).where(Product.restaurant_id == restaurant.id)
                ).all()
                for product in products:
                    if not product.image_url or product.image_source == ImageSource.PEXELS:
                        image_url, image_source, attribution = product_photo(product.slug)
                        product.image_url = image_url
                        product.image_source = image_source
                        product.image_attribution = attribution
                continue
            restaurant = Restaurant(
                city_id=city.id,
                name=name,
                slug=slug,
                description=description,
                cover_url=photo_url(key),
                image_source=ImageSource.PEXELS,
                image_attribution=f"Pexels · {PHOTOS[key][1]} · Иллюстрация кухни",
                address_text="Бишкек · демонстрационный адрес",
                is_verified=True,
                is_demo=True,
                is_featured=index < 3,
                estimated_delivery_min=low,
                estimated_delivery_max=high,
                minimum_order=0,
                base_delivery_fee=fee,
                cuisines=[cuisine],
            )
            db.add(restaurant)
            db.flush()
            category = MenuCategory(restaurant_id=restaurant.id, name=category_name, slug="main")
            db.add(category)
            db.flush()
            for number, (product_slug, product_name, detail, price, weight) in enumerate(menu):
                image_url, image_source, attribution = product_photo(product_slug)
                db.add(
                    Product(
                        restaurant_id=restaurant.id,
                        menu_category_id=category.id,
                        name=product_name,
                        slug=product_slug,
                        description=detail,
                        price=Decimal(price),
                        weight_value=weight,
                        image_url=image_url,
                        image_source=image_source,
                        image_attribution=attribution,
                        is_featured=number == 0,
                    )
                )
        db.commit()
    print("Catalog seeded. Repeated runs preserve existing data.")


if __name__ == "__main__":
    seed()
