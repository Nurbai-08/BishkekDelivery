# BISHKEK DELIVERY — ПОЛНОЕ ТЕХНИЧЕСКОЕ ЗАДАНИЕ

## 0. Главная инструкция для AI-агента

Не создавать проект как демонстрационный frontend с mock-данными.

Необходимо разработать полноценное fullstack web-приложение сервиса заказа и доставки еды для города Бишкек.

Проект должен быть подготовлен к реальному deploy с самого начала.

Главные требования:

- frontend — React + TypeScript;
- backend — FastAPI;
- database — PostgreSQL;
- authentication — Firebase Authentication;
- фотографии — отдельное object storage/API, не PostgreSQL;
- архитектура frontend — FSD;
- backend должен иметь понятное разделение слоёв;
- никакого хранения паролей пользователей в собственной БД;
- никаких mock API после подключения backend;
- никаких destructive database reset для исправления миграций;
- все изменения БД выполняются через Alembic;
- UI разрабатывается только после применения skill `ui-ux-pro-max`;
- приложение должно быть responsive;
- проект должен быть готов к GitHub CI/CD и production deploy;
- не переписывать рабочую функциональность без необходимости.

Перед изменением существующего функционала сначала изучить текущую реализацию.

После каждого крупного этапа выполнять:

```bash
frontend:
npm run lint
npm run typecheck
npm run build

backend:
ruff check .
pytest
```

Ошибки исправлять до перехода к следующему этапу.

---

# 1. Название проекта

Рабочее название:

**Bishkek Delivery**

Название должно быть легко заменяемым через конфигурацию приложения.

Не хардкодить название во множестве компонентов.

Например:

```env
VITE_APP_NAME=Bishkek Delivery
```

---

# 2. Концепция

Bishkek Delivery — сервис заказа еды из ресторанов Бишкека.

Пользователь должен иметь возможность:

1. зарегистрироваться;
2. войти;
3. указать адрес;
4. выбрать категорию кухни;
5. найти ресторан;
6. открыть ресторан;
7. посмотреть меню;
8. добавить блюда в корзину;
9. оформить заказ;
10. отслеживать статус заказа;
11. посмотреть историю заказов;
12. оставить отзыв.

Кроме пользователей существуют:

- владельцы ресторанов;
- курьеры;
- администраторы.

---

# 3. География

Первая версия работает только для:

```text
Бишкек, Кыргызстан
```

Архитектура должна позволять добавить другие города в будущем.

Не хардкодить всю бизнес-логику только под строку `"Bishkek"`.

Создать сущность:

```text
cities
```

Первая запись:

```text
Bishkek
Кыргызстан
Asia/Bishkek
```

---

# 4. Основной стек

## Frontend

Использовать:

```text
React
TypeScript
Vite
Tailwind CSS
React Router
Redux Toolkit
RTK Query
React Hook Form
Zod
FSD
Lucide React
```

Допускаются дополнительные небольшие библиотеки только при реальной необходимости.

Не добавлять тяжёлые библиотеки ради одной простой функции.

---

# 5. UI/UX skill — ОБЯЗАТЕЛЬНО

Перед созданием или серьёзным изменением пользовательского интерфейса необходимо активировать:

```text
$ui-ux-pro-max
```

Skill должен применяться для:

- Home Page;
- restaurant cards;
- restaurant page;
- product cards;
- search;
- filters;
- cart;
- checkout;
- authentication pages;
- profile;
- order tracking;
- restaurant dashboard;
- courier dashboard;
- admin dashboard;
- forms;
- modals;
- navigation;
- responsive layouts;
- loading states;
- empty states;
- errors;
- accessibility;
- animations.

Нельзя сначала сделать случайный дизайн, а потом поверхностно «улучшить».

Сначала:

```text
UI/UX Pro Max
↓
Design direction
↓
Design system
↓
Components
↓
Pages
```

---

# 6. UI/UX требования

Проект НЕ должен выглядеть:

- как стандартный AI-generated dashboard;
- как Bootstrap template;
- как учебный CRUD;
- как копия Wolt;
- как копия Yandex Eats;
- как набор одинаковых карточек без визуальной иерархии.

Нужна собственная визуальная идентичность.

Направление:

```text
modern
clean
food-focused
warm
premium
friendly
mobile-first
```

Интерфейс должен создавать ощущение настоящего сервиса доставки.

---

# 7. Design System

Перед созданием страниц создать:

```text
src/shared/styles/
src/shared/ui/
```

Определить semantic design tokens.

Например:

```text
background
surface
surface-elevated

text-primary
text-secondary
text-muted

primary
primary-hover
primary-active

success
warning
danger

border
focus
```

Не использовать случайные HEX-цвета внутри компонентов.

Плохо:

```tsx
className="bg-[#F17352]"
```

Хорошо:

```tsx
className="bg-primary"
```

---

# 8. Цветовое направление

Выбрать через `ui-ux-pro-max`.

Предпочтительное направление:

```text
Warm Off White — background
Near Black — typography
Warm Orange / Terracotta — primary
Soft Gray — secondary surfaces
Green — successful order states
```

Основной цвет не должен превращать весь сайт в сплошной оранжевый фон.

Primary используется для:

- CTA;
- выбранных состояний;
- progress;
- небольших акцентов.

---

# 9. Типографика

Использовать современный читаемый sans-serif.

Должна существовать система:

```text
display
h1
h2
h3
body-lg
body
body-sm
caption
button
```

Base font size:

```text
16px
```

Не использовать слишком мелкий основной текст.

---

# 10. Accessibility

Обязательные требования:

- WCAG AA;
- достаточная контрастность;
- keyboard navigation;
- видимый focus state;
- aria-label для icon-only buttons;
- alt для meaningful images;
- формы имеют настоящие labels;
- ошибки формы не передаются только цветом;
- поддерживать `prefers-reduced-motion`;
- touch target минимум ~44×44 px;
- приложение должно работать при zoom;
- нельзя отключать browser zoom.

---

# 11. Responsive

Mobile-first.

Поддерживать:

```text
360px+
390px
430px
768px
1024px
1280px
1440px+
```

Никакого horizontal scroll.

Особое внимание мобильной версии, потому что сервис заказа еды преимущественно используется с телефона.

---

# 12. Navigation

Desktop:

```text
Logo
Location
Search
Orders
Favorites
Profile
Cart
```

Mobile:

```text
Home
Search
Orders
Favorites
Profile
```

Корзина может отображаться отдельным floating/sticky CTA, когда в ней есть товары.

Не перегружать bottom navigation.

---

# 13. Authentication

Использовать:

**Firebase Authentication**

Firebase отвечает ТОЛЬКО за identity/authentication.

Не использовать Firebase Firestore как основную БД.

Основные данные находятся в PostgreSQL.

Поддержать:

```text
Email + Password
Google Sign-In
```

Архитектуру подготовить для будущего:

```text
Phone OTP +996
```

---

# 14. Firebase flow

Frontend:

```text
Firebase Authentication
        ↓
Firebase ID Token
        ↓
Authorization: Bearer <token>
        ↓
FastAPI
```

Backend проверяет Firebase ID Token через Firebase Admin SDK.

После проверки backend получает:

```text
firebase_uid
email
name
```

и связывает Firebase пользователя с локальным пользователем PostgreSQL.

---

# 15. Пользователь в PostgreSQL

Таблица:

```text
users

id UUID PRIMARY KEY
firebase_uid VARCHAR UNIQUE NOT NULL

email VARCHAR
phone VARCHAR
first_name VARCHAR
last_name VARCHAR
avatar_url VARCHAR

role USER_ROLE
is_active BOOLEAN
is_blocked BOOLEAN

created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Пароля в таблице НЕ должно быть.

---

# 16. Роли

```text
CUSTOMER
RESTAURANT_OWNER
COURIER
ADMIN
```

Authorization выполняется backend.

Frontend не является источником истины для permissions.

Нельзя делать:

```tsx
if (user.role === "ADMIN")
```

единственной защитой admin API.

FastAPI обязан независимо проверять роль пользователя.

---

# 17. Backend

Использовать:

```text
Python
FastAPI
Pydantic
SQLAlchemy 2
Alembic
PostgreSQL
Firebase Admin SDK
httpx
pytest
ruff
```

Для PostgreSQL использовать современный driver:

```text
psycopg
```

или async driver при выбранной async architecture.

Не смешивать sync и async хаотично.

Выбрать один подход и придерживаться его по всему backend.

---

# 18. Backend architecture

Пример:

```text
backend/

app/
├── api/
│   └── v1/
│       ├── auth.py
│       ├── users.py
│       ├── restaurants.py
│       ├── cuisines.py
│       ├── products.py
│       ├── cart.py
│       ├── orders.py
│       ├── reviews.py
│       ├── favorites.py
│       ├── courier.py
│       └── admin.py
│
├── core/
│   ├── config.py
│   ├── security.py
│   ├── firebase.py
│   ├── exceptions.py
│   └── logging.py
│
├── db/
│   ├── base.py
│   ├── session.py
│   └── migrations/
│
├── models/
├── schemas/
├── repositories/
├── services/
├── dependencies/
├── tests/
└── main.py
```

Router не должен содержать огромное количество бизнес-логики.

Использовать:

```text
router
↓
service
↓
repository
↓
database
```

---

# 19. PostgreSQL

Основная production database:

```text
Neon PostgreSQL
```

Подключение исключительно через:

```env
DATABASE_URL=
```

Нельзя хардкодить connection string.

Backend должен работать с любым совместимым PostgreSQL.

---

# 20. Database migrations

Использовать:

```text
Alembic
```

Каждое изменение schema:

```text
new model
new field
index
constraint
relationship
```

должно сопровождаться migration.

ЗАПРЕЩЕНО решать проблемы миграций командами типа:

```text
DROP DATABASE
DELETE ALL TABLES
RESET DATABASE
```

если пользователь явно этого не запросил.

Existing data должен сохраняться.

---

# 21. UUID

Основные публичные сущности используют UUID:

```text
users
restaurants
products
orders
reviews
addresses
```

---

# 22. Timestamp

Использовать:

```text
TIMESTAMPTZ
```

В БД хранить timezone-aware timestamps.

UI отображает время относительно:

```text
Asia/Bishkek
```

---

# 23. Основные сущности БД

Необходимо создать минимум:

```text
cities

users
addresses

restaurants
restaurant_members

cuisines
restaurant_cuisines

menu_categories
products

favorites

orders
order_items
order_status_history

reviews

courier_profiles
courier_deliveries

promo_codes
```

Promo codes можно реализовать после MVP, но schema должна быть расширяемой.

---

# 24. Cities

```text
cities

id
name
country
timezone
is_active
created_at
```

Seed:

```text
Bishkek
Kyrgyzstan
Asia/Bishkek
```

---

# 25. Cuisines

Сущность означает тип кухни.

Примеры:

```text
Японская
Итальянская
Американская
Кыргызская
Корейская
Китайская
Турецкая
Фастфуд
Кофе и десерты
```

Schema:

```text
cuisines

id
name
slug
image_url
is_active
sort_order
```

---

# 26. Restaurants

```text
restaurants

id UUID

city_id
owner_id

name
slug
description

phone
email

logo_url
cover_url

address_text

latitude
longitude

rating
review_count

minimum_order
base_delivery_fee

estimated_delivery_min
estimated_delivery_max

opening_time
closing_time

is_open
is_active
is_verified

created_at
updated_at
```

---

# 27. Restaurant ↔ cuisine

Ресторан может относиться к нескольким кухням.

Пример:

```text
Sakura

Japanese
Asian
Sushi
```

Использовать many-to-many:

```text
restaurant_cuisines

restaurant_id
cuisine_id
```

---

# 28. Menu categories

Это НЕ тип кухни.

Например:

```text
Restaurant:
Sakura Sushi

Cuisine:
Japanese

Menu categories:
Роллы
Суши
Сеты
Супы
Напитки
```

Schema:

```text
menu_categories

id
restaurant_id
name
slug
sort_order
is_active
```

---

# 29. Products

```text
products

id UUID
restaurant_id
menu_category_id

name
slug
description

price

weight_value
weight_unit

image_url
image_source
image_attribution

is_available
is_featured

created_at
updated_at
```

Price хранить как:

```text
NUMERIC
```

а не float.

---

# 30. Image source

Enum:

```text
RESTAURANT_UPLOAD
GOOGLE_PLACES
PEXELS
SYSTEM
```

Архитектура должна позволять добавить другие image provider в будущем.

---

# 31. Фотографии

Сами изображения в PostgreSQL не сохранять.

PostgreSQL хранит:

```text
image_url
source
attribution
metadata
```

Файлы загружаются в:

```text
Cloudflare R2
```

---

# 32. Google фотографии

НЕ делать scraping Google Images.

Для ресторанов разрешается использовать интеграцию:

```text
Google Places
```

для получения фотографий мест/ресторанов.

Google provider должен быть вынесен в отдельный service:

```text
services/images/google_places.py
```

Frontend не должен напрямую зависеть от Google API structure.

Использовать backend abstraction:

```text
ImageProvider
```

Чтобы позже можно было заменить Google без переписывания приложения.

---

# 33. Фото конкретных блюд

Приоритет:

```text
1. Restaurant uploaded photo
2. Approved external provider
3. Default placeholder
```

Для seed/demo блюд допускается отдельный provider реальных food-фотографий.

AI-generated food photos по умолчанию НЕ использовать.

Каждая external фотография должна хранить информацию об источнике.

---

# 34. R2 structure

Пример:

```text
restaurants/
    {restaurant_id}/
        logo/
        covers/

products/
    {restaurant_id}/
        {product_id}/

users/
    {user_id}/
        avatars/
```

Файл должен получать уникальное имя.

Не использовать оригинальное имя пользователя как единственный storage key.

---

# 35. Addresses

```text
addresses

id UUID
user_id
city_id

label

street
house
apartment
entrance
floor

comment

latitude
longitude

is_default

created_at
updated_at
```

Пример labels:

```text
Дом
Работа
Другое
```

---

# 36. Карта

На первой версии допускается обычный address input.

Архитектуру подготовить для:

```text
OpenStreetMap
MapLibre
```

Позже:

```text
pin location
delivery radius
courier tracking
```

---

# 37. География / PostGIS

Database должна быть совместима с будущим включением:

```text
PostGIS
```

Это потребуется для:

```text
nearest restaurants
delivery radius
distance
courier position
delivery zones
```

Не реализовывать сложную GIS-логику в MVP, если она мешает закончить основные заказы.

---

# 38. Favorites

```text
favorites

user_id
restaurant_id
created_at
```

Unique constraint:

```text
(user_id, restaurant_id)
```

---

# 39. Cart

Основной cart state можно хранить на frontend.

Redux Toolkit.

Сохранять cart в localStorage.

Но cart должен быть связан только с одним рестораном.

Если пользователь пытается добавить блюдо другого ресторана:

```text
"В корзине уже есть блюда из другого ресторана.
Очистить корзину и добавить новое блюдо?"
```

Buttons:

```text
Отмена
Очистить и добавить
```

---

# 40. Cart item

```text
product_id
name
image_url
unit_price
quantity
```

Frontend не является источником истины для final price.

При оформлении FastAPI повторно получает актуальные цены из PostgreSQL.

Нельзя доверять:

```text
total
price
discount
```

пришедшим с клиента.

---

# 41. Orders

```text
orders

id UUID
order_number

customer_id
restaurant_id
courier_id

delivery_address_id

status

subtotal
delivery_fee
discount
total

payment_method
payment_status

customer_comment

created_at
confirmed_at
delivered_at
cancelled_at
updated_at
```

---

# 42. Order items

Обязательно сохранять snapshot данных.

```text
order_items

id
order_id
product_id

product_name
product_image_url

unit_price
quantity
total_price
```

Это важно.

Если ресторан завтра поменяет:

```text
Филадельфия
420 → 490 сом
```

старый заказ должен продолжить показывать:

```text
420 сом
```

---

# 43. Order statuses

Использовать enum:

```text
PENDING
CONFIRMED
PREPARING
READY_FOR_PICKUP
COURIER_ASSIGNED
PICKED_UP
DELIVERING
DELIVERED
CANCELLED
```

---

# 44. Order status history

Создать:

```text
order_status_history

id
order_id

from_status
to_status

changed_by_user_id

created_at
```

Нельзя хранить только текущий статус.

История понадобится для:

- tracking;
- disputes;
- analytics;
- debugging.

---

# 45. Checkout

Checkout flow:

```text
Cart
↓
Address
↓
Delivery details
↓
Payment method
↓
Review order
↓
Place order
```

Не делать огромную форму одним экраном на мобильном.

Использовать progressive disclosure.

---

# 46. Payment

MVP:

```text
CASH
CARD_ON_DELIVERY
```

Настоящий payment gateway пока не подключать.

Архитектура:

```text
PaymentProvider
```

должна позволять позже подключить реальную оплату.

---

# 47. Reviews

Пользователь может оставить отзыв только после:

```text
DELIVERED
```

Schema:

```text
reviews

id
order_id
user_id
restaurant_id

rating
comment

created_at
updated_at
```

Rating:

```text
1–5
```

Один order → максимум один restaurant review.

---

# 48. Restaurant rating

Не доверять rating, пришедшему с frontend.

Рейтинг рассчитывается backend на основе reviews.

Хранить:

```text
rating
review_count
```

можно как cached aggregate.

---

# 49. Restaurant dashboard

Route:

```text
/merchant
```

Разделы:

```text
Overview
Orders
Menu
Reviews
Restaurant
Settings
```

Dashboard показывает:

```text
Orders today
Revenue today
Average order
Active orders
Top products
```

---

# 50. Merchant orders

Restaurant owner может:

```text
PENDING
→ CONFIRMED

CONFIRMED
→ PREPARING

PREPARING
→ READY_FOR_PICKUP
```

Недопустимые переходы backend должен блокировать.

Например нельзя:

```text
PENDING
→ DELIVERED
```

---

# 51. Restaurant menu management

Owner может:

- создавать menu category;
- менять order;
- добавлять product;
- редактировать product;
- менять price;
- менять availability;
- добавлять image;
- временно скрывать product.

Для удаления лучше использовать soft delete/is_active, если product уже фигурировал в заказах.

---

# 52. Courier profile

```text
courier_profiles

user_id
vehicle_type
is_online
is_verified
rating
created_at
```

Vehicle:

```text
WALK
BICYCLE
SCOOTER
CAR
```

---

# 53. Courier flow

Courier:

```text
Login
↓
Go online
↓
Available deliveries
↓
Accept
↓
Go to restaurant
↓
Pickup
↓
Deliver
↓
Complete
```

В MVP назначение курьера может быть упрощено.

---

# 54. Admin

Route:

```text
/admin
```

Только роль:

```text
ADMIN
```

Разделы:

```text
Dashboard
Users
Restaurants
Couriers
Orders
Cuisines
Reviews
System
```

---

# 55. Admin functionality

Admin может:

- approve restaurant;
- disable restaurant;
- approve courier;
- block user;
- manage cuisines;
- inspect orders;
- inspect reviews;
- manage featured restaurants.

Admin НЕ должен иметь возможность случайно удалять критичные production data одной кнопкой без confirmation.

---

# 56. API prefix

Все API:

```text
/api/v1/
```

Например:

```text
/api/v1/restaurants
```

Это позволит сделать:

```text
/api/v2/
```

в будущем.

---

# 57. Auth API

```text
GET /api/v1/auth/me

POST /api/v1/auth/sync
POST /api/v1/auth/logout
```

Firebase login/register выполняется frontend Firebase SDK.

Backend отвечает за sync локального profile.

---

# 58. Restaurants API

```text
GET /api/v1/restaurants
GET /api/v1/restaurants/{id}

GET /api/v1/restaurants/{id}/menu
GET /api/v1/restaurants/{id}/reviews
```

Filters:

```text
cuisine
search
rating
delivery_time
sort
page
limit
```

---

# 59. Cuisines API

```text
GET /api/v1/cuisines
GET /api/v1/cuisines/{slug}/restaurants
```

---

# 60. Products API

```text
GET /api/v1/products/{id}
```

Merchant:

```text
POST   /api/v1/merchant/products
PATCH  /api/v1/merchant/products/{id}
DELETE /api/v1/merchant/products/{id}
```

---

# 61. Orders API

```text
POST /api/v1/orders

GET /api/v1/orders/me
GET /api/v1/orders/{id}

POST /api/v1/orders/{id}/cancel
```

Merchant:

```text
GET /api/v1/merchant/orders
PATCH /api/v1/merchant/orders/{id}/status
```

Courier:

```text
GET /api/v1/courier/deliveries
POST /api/v1/courier/deliveries/{id}/accept
PATCH /api/v1/courier/deliveries/{id}/status
```

---

# 62. Pagination

Никогда не возвращать потенциально бесконечные списки.

Использовать pagination.

Например:

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 241,
  "pages": 13
}
```

---

# 63. Search

Поиск должен находить:

```text
restaurant name
product name
cuisine
```

Например:

```text
суши
Филадельфия
бургеры
пицца
```

На первом этапе использовать PostgreSQL search/indexes.

Отдельный Elasticsearch не нужен.

---

# 64. Database indexes

Добавить индексы минимум для:

```text
users.firebase_uid

restaurants.city_id
restaurants.slug
restaurants.is_active

products.restaurant_id
products.menu_category_id
products.is_available

orders.customer_id
orders.restaurant_id
orders.courier_id
orders.status
orders.created_at

reviews.restaurant_id
```

Indexes должны добавляться миграциями.

---

# 65. Frontend architecture — FSD

Структура:

```text
frontend/src/

app/
    providers/
    router/
    styles/

pages/
    home/
    search/
    restaurant/
    cart/
    checkout/
    orders/
    order-details/
    favorites/
    profile/
    auth/
    merchant/
    courier/
    admin/

widgets/
    header/
    mobile-navigation/
    restaurant-card/
    restaurant-grid/
    product-card/
    menu-section/
    cart-summary/
    order-tracker/

features/
    auth/
    search/
    filter-restaurants/
    add-to-cart/
    change-cart-quantity/
    checkout/
    create-order/
    cancel-order/
    favorite-restaurant/
    leave-review/

entities/
    user/
    restaurant/
    cuisine/
    product/
    order/
    review/
    address/

shared/
    api/
    ui/
    lib/
    hooks/
    config/
    assets/
    styles/
    types/
```

Соблюдать boundaries FSD.

---

# 66. Redux

Redux Toolkit используется для:

```text
auth application state
cart
UI state при необходимости
```

Server data получать через:

```text
RTK Query
```

Не дублировать API data одновременно:

```text
RTK Query cache
+
Redux slice
```

без необходимости.

---

# 67. RTK Query

Создать base API:

```text
shared/api/baseApi
```

Автоматически прикреплять Firebase token к authenticated requests.

Не писать вручную Authorization header в каждом feature.

---

# 68. Forms

Использовать:

```text
React Hook Form
+
Zod
```

Validation должна существовать:

```text
frontend
+
backend
```

Frontend validation — UX.

Backend validation — security/source of truth.

---

# 69. Loading states

Запрещено оставлять пустой экран.

Использовать:

```text
Skeleton
Spinner только там, где он действительно нужен
Button loading state
```

При loading кнопка:

```text
disabled
```

и показывает понятный feedback.

---

# 70. Error states

Каждая API-heavy page должна иметь:

```text
loading
success
empty
error
```

Не использовать только:

```text
console.error()
```

для пользовательских ошибок.

Пользователь получает понятный message.

---

# 71. Empty states

Пример favorites:

```text
Пока нет избранных ресторанов
Добавляйте любимые места, чтобы быстро находить их здесь.
```

CTA:

```text
Найти рестораны
```

---

# 72. Toasts

Использовать для:

```text
Product added
Profile saved
Order cancelled
Error
```

Но критичные действия должны иметь inline feedback, а не только toast.

---

# 73. Home page

Структура:

```text
Header
Location
Search
Cuisine categories
Promo/hero area
Popular nearby
Fast delivery
Top-rated
Restaurant feed
Footer
```

Не превращать Home в огромный landing page.

Главная задача — быстро найти еду.

---

# 74. Cuisine section

Примеры:

```text
Суши
Пицца
Бургеры
Фастфуд
Шаурма
Кыргызская
Азиатская
Десерты
Кофе
```

Использовать реальные food photography или качественные category images.

Не использовать emoji как UI icons.

---

# 75. Restaurant card

Карточка минимум:

```text
cover
restaurant name
cuisine labels
rating
delivery time
delivery fee
```

Также:

```text
favorite button
```

Изображение должно иметь фиксированный aspect ratio, чтобы не было layout shift.

---

# 76. Restaurant page

Структура:

```text
Cover
Logo
Name
Rating
Cuisine
Delivery information

Sticky menu categories

Products grouped by menu category
```

Mobile:

при наличии cart снизу sticky:

```text
Корзина • 3 товара • 1 240 сом
```

---

# 77. Product card

Показывать:

```text
photo
name
description
price
weight
add button
```

Не перегружать.

Если unavailable:

```text
Нет в наличии
```

Add button disabled.

---

# 78. Product modal

При необходимости:

```text
large image
name
description
weight
price

quantity

Add to cart
```

Не создавать modal, если карточка и так содержит достаточно информации.

---

# 79. Cart

Route:

```text
/cart
```

Показывать:

```text
restaurant
products
quantity
subtotal
delivery
discount
total
```

CTA:

```text
Перейти к оформлению
```

---

# 80. Checkout

Route:

```text
/checkout
```

Требует authentication.

Если пользователь не авторизован:

```text
login
↓
возврат обратно в checkout
```

Не терять корзину после login.

---

# 81. Order page

Route:

```text
/orders/{id}
```

Показывать:

```text
Order number
Restaurant
Items
Total
Address
Payment
Current status
Timeline
Courier
```

---

# 82. Order tracker

Visual timeline:

```text
Заказ создан
↓
Ресторан принял
↓
Готовится
↓
Готов
↓
Курьер забрал
↓
В пути
↓
Доставлен
```

Не показывать будущие этапы как уже завершённые.

---

# 83. Realtime

MVP может использовать polling:

```text
каждые 10–20 секунд
```

только на active order page.

Вторая версия:

```text
WebSocket
```

Не добавлять WebSocket раньше, чем работает стабильная order state machine.

---

# 84. Performance

Images:

```text
WebP / AVIF
lazy loading
responsive sizes
```

Не загружать изображения 4000×4000 для маленькой карточки.

Использовать:

```text
loading="lazy"
```

за исключением above-the-fold critical images.

---

# 85. Code splitting

Использовать lazy routes для тяжёлых кабинетов:

```text
merchant
courier
admin
```

Не загружать admin dashboard обычному покупателю.

---

# 86. Security

Backend обязательно:

- verify Firebase ID tokens;
- validate role;
- validate ownership;
- validate request body;
- не доверять price с frontend;
- не доверять user_id с frontend;
- не доверять restaurant_id без проверки;
- CORS только для разрешённых origins;
- secrets только в env;
- API keys не отдавать frontend без необходимости;
- rate limiting подготовить архитектурно.

---

# 87. Authorization examples

Restaurant owner может изменять только свой ресторан.

Нельзя:

```text
PATCH /merchant/products/{product_of_another_restaurant}
```

Даже если пользователь вручную отправил API request.

Backend обязан проверить ownership.

---

# 88. Environment variables

Root:

```text
.env.example
```

Frontend:

```env
VITE_API_URL=
VITE_APP_NAME=

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

Backend:

```env
APP_ENV=
DATABASE_URL=

FRONTEND_URL=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

GOOGLE_PLACES_API_KEY=
```

Secrets никогда не commit.

---

# 89. .gitignore

Обязательно исключить:

```text
.env
.env.*
!.env.example

node_modules
dist

.venv
__pycache__

coverage

Firebase service account JSON

local credentials
```

---

# 90. Docker

Backend должен иметь:

```text
Dockerfile
```

Также root:

```text
docker-compose.yml
```

Docker используется для воспроизводимости.

Production не должен зависеть от настроек конкретного Mac разработчика.

---

# 91. Deployment

Предпочтительная схема:

```text
Frontend
→ Vercel

Backend
→ Railway

Database
→ Neon PostgreSQL

Authentication
→ Firebase Authentication

Images
→ Cloudflare R2
```

---

# 92. Domains

Подготовить architecture для:

```text
bishkekdelivery.com

api.bishkekdelivery.com
```

Фактический domain можно выбрать позже.

---

# 93. Health check

Backend:

```text
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

Дополнительно production health может проверять database connectivity.

---

# 94. Logging

Backend должен иметь structured logging.

Логировать:

```text
request id
route
status
duration
important domain errors
```

Не логировать:

```text
Firebase token
credentials
API keys
private data
```

---

# 95. Error format

API errors должны иметь единый формат.

Например:

```json
{
  "error": {
    "code": "PRODUCT_UNAVAILABLE",
    "message": "Блюдо временно недоступно"
  }
}
```

Frontend должен уметь обрабатывать error codes.

---

# 96. Testing — backend

Минимум:

```text
auth verification
restaurants
products
cart validation
order creation
price recalculation
order status transitions
permissions
reviews
```

Использовать:

```text
pytest
```

Особенно важно протестировать permissions.

---

# 97. Testing — frontend

Минимум проверить:

```text
cart
auth redirect
checkout validation
restaurant loading
API errors
protected routes
```

Критические flows покрыть automated tests по мере развития.

---

# 98. E2E

Перед production сделать минимум один полный E2E flow:

```text
Register/Login
↓
Open restaurant
↓
Add products
↓
Cart
↓
Checkout
↓
Create order
↓
Restaurant confirms
↓
Order delivered
```

---

# 99. Seed data

Создать idempotent seed.

Seed НЕ должен создавать дубликаты при повторном запуске.

Добавить несколько demo cuisines:

```text
Японская
Итальянская
Американская
Кыргызская
Фастфуд
Кофе
```

---

# 100. Demo restaurants

Создать только вымышленные demo-рестораны.

Например:

```text
Sakura Sushi
Fire Pizza
Bish Burger
Nomad Kitchen
Chicken Lab
Coffee Yard
```

Не выдавать вымышленные рестораны за настоящие.

---

# 101. Demo menu

Sakura Sushi:

```text
Роллы
Суши
Сеты
Супы
Напитки
```

Продукты:

```text
Филадельфия
Калифорния
Темпура ролл
Сет Sakura
Мисо суп
```

Fire Pizza:

```text
Пицца
Закуски
Напитки
```

Продукты:

```text
Маргарита
Пепперони
4 сыра
BBQ Chicken
```

Bish Burger:

```text
Бургеры
Картофель
Закуски
Напитки
```

---

# 102. Seed images

Seed script не должен скачивать сотни изображений при каждом запуске.

Создать устойчивый механизм:

```text
seed data
+
stable external/source URLs
```

или один раз загрузить approved assets в R2.

Seed должен быть повторяемым.

---

# 103. Запрещённые shortcuts

AI-агенту запрещено:

```text
удалять базу для исправления migration
заменять backend mock data
хардкодить пользователей
хардкодить цены в frontend
хранить пароли
хранить Firebase Admin credentials в git
использовать random images без source
создавать огромные components на 1000+ строк
дублировать API clients
игнорировать TypeScript errors
использовать any везде
отключать ESLint чтобы build прошёл
ловить ошибки пустым catch
```

---

# 104. Правила изменения существующего проекта

Когда пользователь просит добавить функцию:

1. изучить существующую architecture;
2. определить затрагиваемые modules;
3. не переписывать несвязанные части;
4. сохранять backward compatibility;
5. создать migration, если меняется schema;
6. обновить schemas;
7. обновить API;
8. обновить frontend;
9. обновить tests;
10. запустить проверки.

---

# 105. Нельзя исправлять bug удалением функциональности

Пример:

Если не работает Firebase Auth, нельзя:

```text
удалить Firebase
и заменить fake login
```

Если не работает PostgreSQL migration, нельзя:

```text
drop database
```

Если TypeScript ругается, нельзя:

```text
as any
```

как универсальное решение.

Необходимо найти root cause.

---

# 106. Git

Использовать понятные commits:

```text
feat(auth): add firebase authentication
feat(restaurants): add restaurant catalog
feat(cart): add persistent cart
feat(orders): create checkout flow
fix(auth): restore token refresh
```

Не делать один commit:

```text
update
```

на весь проект.

---

# 107. CI

GitHub Actions должен проверять каждый pull request.

Frontend:

```text
install
lint
typecheck
build
```

Backend:

```text
install
ruff
pytest
```

Deploy разрешать только после успешных checks.

---

# 108. Migration deployment

Production deployment sequence:

```text
build
↓
tests
↓
alembic upgrade head
↓
backend deploy
```

Migration должна быть максимально backward-compatible.

---

# 109. Backup mindset

Production data считается важным.

Нельзя рассчитывать на возможность:

```text
"если сломается — просто очистим базу"
```

Schema должна развиваться миграциями.

---

# 110. README

README должен содержать:

```text
Project description
Architecture
Stack
Requirements
Installation
Environment variables
Firebase setup
Database setup
R2 setup
Local development
Migrations
Seed
Tests
Docker
Deploy
```

Новый разработчик должен запустить проект по README.

---

# 111. Documentation

Backend предоставляет:

```text
/docs
```

через FastAPI OpenAPI.

Endpoint descriptions должны быть понятными.

---

# 112. MVP — что должно работать обязательно

Первая полностью рабочая версия:

```text
Firebase registration/login

User profile

Bishkek address

Cuisine categories

Restaurants

Restaurant page

Menu

Products

Cart

Checkout

Create order

Order history

Order status

Restaurant dashboard

Restaurant accepts order

Restaurant prepares order

Courier role/basic flow

Admin basic moderation

Reviews
```

---

# 113. Что НЕ делать до завершения MVP

Не тратить время сначала на:

```text
live courier GPS
advanced WebSocket
machine learning
recommendation AI
multiple cities
complex promo system
real payment gateway
chat
microservices
Kubernetes
Elasticsearch
Redis everywhere
```

Сначала должен стабильно работать основной business flow.

---

# 114. Phase 2

После стабильного MVP:

```text
MapLibre / OpenStreetMap

PostGIS distance calculations

Live courier location

WebSocket order updates

Phone +996 OTP

Push notifications

Promo codes

Online payment

Restaurant analytics

Courier earnings

Delivery zones
```

---

# 115. Главный user flow

Приложение считается функциональным, только если полностью работает:

```text
USER

Firebase Login
   ↓
Home
   ↓
Japanese
   ↓
Sakura Sushi
   ↓
Philadelphia x2
   ↓
Cart
   ↓
Address
   ↓
Checkout
   ↓
Order
```

Затем:

```text
RESTAURANT

New order
   ↓
Accept
   ↓
Preparing
   ↓
Ready
```

Затем:

```text
COURIER

Accept delivery
   ↓
Pickup
   ↓
Deliver
```

И пользователь видит:

```text
DELIVERED
```

---

# 116. Definition of Done

Feature считается завершённой только если:

- UI соответствует design system;
- применён `ui-ux-pro-max`;
- mobile responsive;
- desktop responsive;
- loading state реализован;
- error state реализован;
- empty state реализован, если нужен;
- backend validation присутствует;
- permissions проверяются;
- types корректны;
- migration создана при изменении БД;
- tests не падают;
- lint проходит;
- TypeScript проходит;
- frontend build проходит;
- backend запускается;
- нет secrets в git;
- README обновлён при необходимости.

---

# 117. Pre-delivery UI checklist

Перед завершением UI задачи обязательно проверить:

```text
[ ] нет случайных emoji вместо icons
[ ] единый icon set
[ ] нет hardcoded random HEX
[ ] focus states работают
[ ] buttons имеют loading/disabled state
[ ] click/touch areas достаточно большие
[ ] layout не прыгает при загрузке изображений
[ ] mobile не имеет horizontal scroll
[ ] формы имеют labels
[ ] ошибки формы понятны
[ ] keyboard navigation работает
[ ] изображения имеют alt
[ ] animation 150–300ms там, где уместно
[ ] prefers-reduced-motion поддерживается
[ ] интерфейс выглядит цельно
```

---

# 118. Финальная architecture

```text
                         ┌────────────────────┐
                         │   Firebase Auth    │
                         └─────────┬──────────┘
                                   │
                                   │ Firebase ID Token
                                   ▼
┌────────────────┐          ┌─────────────────┐
│ React / Vite   │─────────▶│     FastAPI     │
│ TypeScript     │   REST   │                 │
│ Tailwind / FSD │◀─────────│ Business Logic  │
└────────────────┘          └───────┬─────────┘
                                    │
                       ┌────────────┼────────────┐
                       │            │            │
                       ▼            ▼            ▼
                PostgreSQL     Cloudflare R2   Google
                   Neon           Images       Places
```

---

# 119. Repository structure

```text
bishkek-delivery/

├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   ├── alembic/
│   ├── tests/
│   ├── Dockerfile
│   ├── alembic.ini
│   └── pyproject.toml
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── .gitignore
├── .env.example
├── PROJECT_SPEC.md
└── README.md
```

---

# 120. Порядок реализации

Не пытаться реализовать весь проект одним огромным изменением.

## Stage 1 — Foundation

```text
Repository
Frontend
Backend
Docker
Environment
CI
Health check
```

## Stage 2 — Authentication

```text
Firebase
Backend verification
users table
auth/me
protected routes
roles
```

## Stage 3 — Database catalog

```text
cities
cuisines
restaurants
menu categories
products
seed
```

## Stage 4 — Customer UI

Сначала активировать:

```text
$ui-ux-pro-max
```

Затем:

```text
Design system
Home
Search
Cuisine
Restaurant
Product
```

## Stage 5 — Cart

```text
Redux
Persistence
Quantities
Totals
Cross-restaurant protection
```

## Stage 6 — Checkout

```text
Addresses
Checkout
Server price verification
Order creation
```

## Stage 7 — Orders

```text
Order history
Order details
Status history
Tracking UI
```

## Stage 8 — Merchant

```text
Dashboard
Orders
Menu management
Product management
```

## Stage 9 — Courier

```text
Courier profile
Delivery list
Accept delivery
Status changes
```

## Stage 10 — Admin

```text
Restaurant approval
Courier approval
Users
Orders
Cuisines
```

## Stage 11 — Media

```text
R2
Restaurant upload
External image provider abstraction
Google Places
```

## Stage 12 — Production hardening

```text
Testing
Error handling
Logging
Performance
Accessibility
Security review
Responsive review
```

## Stage 13 — Deploy

```text
Vercel
Railway
Neon
Firebase
R2
Production environment
```

---

# 121. Ключевой принцип проекта

Это не prototype.

Это не frontend clone.

Это не mock delivery application.

Проект должен строиться как реальное приложение с разделением:

```text
Authentication
Business logic
Persistent data
Media
Permissions
Infrastructure
UI
```

Ни одна технология не должна быть настолько жёстко связана с остальным кодом, чтобы её замена требовала переписывать весь проект.

Особенно:

```text
Firebase → Authentication adapter

Neon → PostgreSQL connection

R2 → Storage adapter

Google/Pexels → Image provider

Vercel/Railway → Deployment only
```

---

# 122. Требование к AI-агенту

Если существует несколько способов реализации:

предпочитать решение, которое:

```text
простое
типизированное
тестируемое
расширяемое
production-friendly
```

Не создавать абстракции «на будущее», если они сейчас не решают реальную проблему.

Но обязательно отделять внешние сервисы:

```text
Firebase
Storage
Image providers
Payment providers
Maps
```

через понятные service/adapters.

Перед завершением каждого этапа проверить, что предыдущие функции продолжают работать.

Главная цель:

**проект должен развиваться постепенно без необходимости каждый раз переделывать фундамент.**