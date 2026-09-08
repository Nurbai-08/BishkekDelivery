# Security and deployment audit

Дата аудита: 2026-09-08. Проверка выполнена по коду, конфигурации, зависимостям, CI и Docker-файлам. Внешний penetration test production-домена не выполнялся.

## Исправлено

- Production-конфигурация требует HTTPS frontend, отключённый demo catalog, включённый rate limiting и TLS для PostgreSQL.
- Swagger/OpenAPI отключаются при `APP_ENV=production`.
- API получает CSP, HSTS в production, `X-Frame-Options`, `Permissions-Policy`, `Referrer-Policy` и `nosniff`.
- Добавлены ограничение размера запроса и in-process rate limiting с отдельным лимитом для заказов, cart validation и upload.
- Nginx и Vercel получают те же security headers.
- Docker Compose больше не использует пароль базы по умолчанию и не передаёт в контейнер локальный путь к Firebase service-account.
- Добавлены Playwright smoke test, Security workflow, Dependabot и production deployment checklist.

## Проверки

- Frontend lint, typecheck и build: пройдены.
- Frontend unit tests: 7 пройдено.
- Backend Ruff: пройден.
- Backend security/config/media tests: 6 пройдено.
- `npm audit --omit=dev --audit-level=high`: 0 уязвимостей.
- `pip-audit --local --strict`: известных уязвимостей не найдено.
- `uv lock --check`: пройден.
- YAML workflow-файлы: корректны.

## Осталось выполнить на staging

- Запустить backend integration tests и `alembic check` на работающей PostgreSQL. Локальная база `127.0.0.1:55432` во время аудита была остановлена.
- Собрать Docker images на машине с Docker и пройти Trivy image scan.
- Установить браузер Playwright и пройти e2e smoke локально или дождаться CI.
- Настроить общий rate limit на API gateway/reverse proxy для нескольких backend replicas.
- Настроить backups/restore, мониторинг `/ready`, уведомления, rollback и проверить Firebase/R2 upload.
- Сделать первый Git commit и push, предварительно убедившись, что `.env` и service-account JSON не отслеживаются.

Production verdict: кодовая база готова к staging, но публичный запуск разрешён только после выполнения оставшихся staging-пунктов.
