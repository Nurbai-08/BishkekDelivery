# Bishkek Delivery

Fullstack-приложение доставки еды: React + TypeScript + FastAPI + PostgreSQL + Firebase Authentication. Интерфейс на русском, суммы в сомах, время в `Asia/Bishkek`.

Реализован основной цикл: каталог → меню → корзина → вход → адрес → проверка актуальных цен → заказ → ресторан → курьер → доставка → отзыв. Каталог загружается из PostgreSQL через API; frontend не подменяет backend данными.

## Архитектура

```text
frontend/src/
  app/       сборка приложения, Redux store, router
  pages/     страницы; кабинеты загружаются через React.lazy
  widgets/   навигация, карточки, операции с заказами
  features/  вход, адреса, избранное, корзина, управление меню
  entities/  типы, Redux cart, RTK Query endpoints
  shared/    базовый API, Firebase adapter, UI, semantic CSS tokens

backend/app/
  api/v1/       HTTP routers, авторизация, request/response contracts
  services/     расчёт корзины, заказы, permissions, media adapters
  repositories/ запросы к каталогу, пагинация
  models/       SQLAlchemy 2
  schemas/      Pydantic
  core/         env, Firebase, ошибки
  db/           engine, sessions, base
```

Зависимости frontend направлены сверху вниз по слоям FSD. Серверные данные хранятся в RTK Query; корзина — Redux Toolkit и localStorage. Внешняя identity изолирована в Firebase adapter; данные приложения — в PostgreSQL; изображения — в R2, в БД только ссылки и источник. Backend использует синхронный SQLAlchemy + psycopg, выполняемый FastAPI в thread pool.

## Что нужно для запуска

- Node.js 24 и npm.
- Python 3.13 и [uv](https://docs.astral.sh/uv/getting-started/installation/).
- PostgreSQL 16+ или Docker Compose.
- Firebase project с Email/Password и Google providers для реального входа. Для локальных проверок доступен официальный Firebase Auth Emulator.
- R2 bucket и ключи нужны только для загрузки фотографий.

## Локальная разработка

Из корня проекта:

```bash
cp .env.example .env
docker compose up -d db
cd backend
uv sync --frozen
uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Во втором терминале:

```bash
cd frontend
npm ci
npm run dev
```

Сайт: [localhost:5173](http://localhost:5173). API: [localhost:8000/docs](http://localhost:8000/docs). `/health` проверяет процесс, `/ready` — доступность PostgreSQL.

Для Docker Compose задайте `POSTGRES_PASSWORD` в `.env` перед запуском. В контейнере нельзя использовать локальный путь `FIREBASE_SERVICE_ACCOUNT_FILE` с компьютера разработчика: передайте `FIREBASE_CLIENT_EMAIL` и `FIREBASE_PRIVATE_KEY` как secret variables либо подключите secret-файл через механизм выбранного хостинга.

На текущем компьютере создан отдельный локальный PostgreSQL в `.local/postgres`, порт **55432**, база `delivery`. Этот порт уже указан в локальном `.env`. Для перезапуска этого экземпляра:

```bash
/opt/homebrew/opt/postgresql@16/bin/pg_ctl -D .local/postgres -l .local/postgres.log -o '-h 127.0.0.1 -p 55432 -k /tmp' start
```

Этот локальный кластер использует trust authentication и слушает только loopback. Для общих окружений используйте пароль и TLS; Docker Compose содержит отдельную конфигурацию базы. Никогда не направляйте тесты на production.

## Firebase

В `.env` заполните:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_APP_ID=...
FIREBASE_PROJECT_ID=your-project
FIREBASE_SERVICE_ACCOUNT_FILE=/absolute/path/to/service-account.json
```

Файл service account должен находиться вне Git. Для хостинга используйте secret variables `FIREBASE_CLIENT_EMAIL` и `FIREBASE_PRIVATE_KEY` (переносы строк можно передать как `\n`) либо Google Application Default Credentials. Переменные `VITE_*` попадают в браузер: private key и Admin credentials туда не помещать. Браузерная Firebase-конфигурация сама по себе не является серверным ключом.

В Firebase Console включите Authentication → Sign-in method → Email/Password и Google. Добавьте домены frontend в Authorized domains, включая `localhost` для локальной разработки. После изменения `.env` перезапустите API; Vite перечитывает env после рестарта.

Backend проверяет ID token через Firebase Admin SDK с `check_revoked=True`, связывает `firebase_uid` с локальным пользователем и независимо проверяет роль, блокировку и ownership. Паролей в PostgreSQL нет. Logout завершает клиентскую Firebase-сессию; существующие ID tokens имеют обычный срок действия Firebase. Для глобального отзыва сессий используйте Firebase Admin.

Официальные инструкции: [проверка ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [управление сессиями](https://firebase.google.com/docs/auth/admin/manage-sessions), [Auth Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth).

## Роли и рестораны

Первый вход создаёт локальный профиль с ролью `CUSTOMER`. Для первоначального администратора используйте доверенную CLI-команду из `backend/`:

```bash
uv run python -m app.manage --uid FIREBASE_UID --role ADMIN
```

После этого администратор может менять роли, создавать рестораны, назначать владельцев, одобрять рестораны и курьеров, блокировать пользователей и управлять кухнями. UUID пользователя доступен в админке; Firebase UID — в Firebase Console.

Для локальной настройки ролей также доступны:

```bash
uv run python -m app.manage --uid FIREBASE_UID --role RESTAURANT_OWNER --restaurant-slug sakura-sushi
uv run python -m app.manage --uid FIREBASE_UID --role COURIER --approve-courier
```

Новый ресторан создаётся закрытым и неподтверждённым. Владелец может заполнить меню до одобрения. После одобрения администратором владелец открывает приём заказов. Кабинеты: `/merchant`, `/courier`, `/admin`.

## Миграции и seed

```bash
cd backend
uv run alembic revision --autogenerate -m "describe schema change"
# Проверьте сгенерированный файл перед применением.
uv run alembic upgrade head
uv run alembic check
uv run python -m app.seed
```

`DEMO_CATALOG=true` явно разрешает seed. Скрипт создаёт 10 вымышленных ресторанов и 40 блюд, не заменяет существующие записи и не создаёт пользователей. Город добавляется отдельной миграцией независимо от demo. Повторный seed не создаёт дубликаты. Демо-рестораны помечены в интерфейсе. Для реальной эксплуатации отключите демо-рестораны через админку и установите `DEMO_CATALOG=false`.

Изменения БД выполняются только Alembic. Не используйте сброс базы для исправления миграций. Production migration запускайте одним release job, до переключения backend, после успешных тестов. Перед изменениями production проверьте резервные копии базы.

## Правила заказов

- Корзина содержит блюда только одного ресторана; смена требует подтверждения.
- Сервер заново проверяет цены, доступность, минимальную сумму и принадлежность адреса городу.
- При изменении итоговой суммы заказ отклоняется с `PRICE_CHANGED` и требует новой проверки.
- `idempotency_key` предотвращает повторное создание при сетевом повторе. Изменённое тело с тем же ключом даёт конфликт.
- Заказ хранит снимки цен, названий и адреса. Последующие изменения каталога и адреса не переписывают историю.
- Ресторан: `PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP`.
- Курьер: принятие готового заказа → `COURIER_ASSIGNED → PICKED_UP → DELIVERING → DELIVERED`.
- Покупатель отменяет только свой `PENDING` заказ. Конкурирующие назначения и смены статуса используют блокировку строк PostgreSQL.
- Оплата: наличными или картой курьеру. Завершая доставку, курьер подтверждает получение оплаты.
- Отзыв: только владелец доставленного заказа, один отзыв на заказ, оценка 1–5. Рейтинг считает backend.
- Страница активного заказа обновляется раз в 15 секунд; polling прекращается после завершения и при потере фокуса окна.

## Фотографии

Заполните `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`. Ключ R2 ограничьте нужным bucket. Endpoint вида `https://ACCOUNT_ID.r2.cloudflarestorage.com`; публичный URL задайте через домен bucket.

В меню владельца: «Изменить» → загрузить JPEG, PNG или WebP до 5 МБ. Сервер проверяет файл, убирает EXIF, уменьшает до 1600px, перекодирует в WebP и создаёт уникальный storage key. Файлы в PostgreSQL не записываются. Без R2 загрузка возвращает понятную ошибку `STORAGE_NOT_CONFIGURED`.

Фотографии кухонь demo-каталога предоставлены Pexels; источники записаны в `app/seed.py` и metadata ресторана. Это иллюстрации кухонь вымышленных ресторанов. До загрузки фотографии конкретного блюда показывается нейтральная заглушка. Seed не скачивает изображения. Адаптер Google Places получает photo references и авторство, отделён от API каталога; показ Google-фото нужно подключать с соблюдением правил атрибуции и срока жизни references. Scraping Google Images не используется.

## Проверки

```bash
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build

cd ../backend
uv run ruff check .
TEST_DATABASE_URL=postgresql+psycopg://delivery:delivery@localhost:5432/delivery_test uv run pytest -q
```

Тестовая PostgreSQL должна быть создана и мигрирована заранее. Тесты работают в транзакциях с rollback; CI создаёт отдельную базу. Покрыты права доступа, Firebase-verification boundary, поиск, корзина, цены, адреса, идемпотентность, статусы, отзыв и изображения.

Для полного локального integration smoke доступны `scripts/emulator_flow.py` и `scripts/serve_emulator.py`. Первому требуются `APP_ENV=development`, проект `demo-bishkek` и emulator на `127.0.0.1:9099`; он создаёт тестовые аккаунты, реальными HTTP-запросами проходит доставку и сохраняет локальные browser credentials в `.local/test-accounts.json`. Эти credentials не попадают в Git.

Запуск эмулятора:

```bash
npm ci --prefix tools
npm run auth --prefix tools
```

Для отдельного тестового frontend используйте `.env.emulator` с теми же DB-настройками, `VITE_FIREBASE_PROJECT_ID=demo-bishkek`, `FIREBASE_PROJECT_ID=demo-bishkek`, `VITE_FIREBASE_API_KEY=local-only`, `VITE_FIREBASE_AUTH_DOMAIN=localhost`, `VITE_FIREBASE_APP_ID=local-app`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, `VITE_FIREBASE_AUTH_EMULATOR_URL=http://127.0.0.1:9099`, `DEV_API_TARGET=http://127.0.0.1:8001`, `FRONTEND_URL=http://localhost:5174`.

```bash
cd backend
uv run python ../scripts/serve_emulator.py
# Другой терминал:
cd frontend
npm run dev -- --mode emulator --port 5174
```

Основной сайт остаётся на 5173 с реальным Firebase project. Production-конфигурация запрещает Firebase Emulator. Инструменты эмулятора находятся в отдельном `tools/` и не входят в Docker production images.

## Docker

```bash
cp .env.example .env
# Заполните Firebase/R2 переменные.
docker compose up --build -d
docker compose exec backend python -m app.seed
```

Сайт доступен на [localhost:8080](http://localhost:8080). Compose запускает PostgreSQL, отдельный migration job, FastAPI и Nginx с SPA fallback и API proxy. Данные хранятся в named volume. `docker compose down` останавливает сервисы; volume не удалять при обычном перезапуске.
