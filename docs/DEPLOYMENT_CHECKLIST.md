# Production deployment checklist

Проект деплоится после прохождения этапов по порядку. Секреты хранятся только в настройках хостинга и никогда не добавляются в Git.

## 1. Репозиторий

- [ ] Создать GitHub-репозиторий и сделать первый commit.
- [ ] Проверить, что `.env`, service-account JSON, `.local/`, `node_modules/` и `.venv/` не попали в commit.
- [ ] Дождаться зелёных workflow `Checks` и `Security checks`.

## 2. PostgreSQL

- [ ] Создать отдельную production-базу.
- [ ] Включить автоматические резервные копии и проверить восстановление на staging.
- [ ] Задать `DATABASE_URL` с `sslmode=require` (или `verify-ca`/`verify-full`).
- [ ] Не использовать пароль `delivery` в production.

## 3. Backend

Задать secret variables:

```dotenv
APP_ENV=production
FRONTEND_URL=https://your-frontend-domain
DATABASE_URL=postgresql+psycopg://...
FIREBASE_PROJECT_ID=bishkekdelivery-b6300
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...\n...
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://...
DEMO_CATALOG=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=120
RATE_LIMIT_STRICT_REQUESTS_PER_MINUTE=20
MAX_REQUEST_BYTES=7000000
```

`FIREBASE_SERVICE_ACCOUNT_FILE` с локальным путём `/Users/...` в контейнере не работает. Для Railway используйте email/private key variables или подключённый secret-файл.

## 4. Миграции и smoke test

- [ ] Запустить `alembic upgrade head` отдельной release/pre-deploy командой.
- [ ] Проверить `/health` и `/ready`.
- [ ] Проверить вход Firebase, каталог, адрес, корзину, создание заказа, смену статуса и отзыв.
- [ ] Проверить, что `/docs`, `/redoc` и `/openapi.json` возвращают 404 в production.
- [ ] Проверить ответы API на `X-Frame-Options`, CSP, HSTS и rate-limit headers.

## 5. Frontend

Для Vercel задать:

```dotenv
VITE_API_URL=https://your-api-domain/api/v1
VITE_APP_NAME=Bishkek Delivery
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=bishkekdelivery-b6300.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bishkekdelivery-b6300
VITE_FIREBASE_APP_ID=...
```

В Firebase Console добавить production-домен в Authorized domains. В backend `FRONTEND_URL` должен совпадать с ним полностью, включая `https://`.

## 6. После запуска

- [ ] Подключить мониторинг `/ready`, 5xx, 429 и времени ответа.
- [ ] Настроить уведомления о падении backend и миграций.
- [ ] Проверить R2 upload и публичную загрузку изображения.
- [ ] Подтвердить rollback на предыдущий образ и восстановление базы из backup.
