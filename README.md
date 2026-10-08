# DVO-L3-7F2A91

<div align="center">
  <img src="./docs/marketing_kit/branding/hero_banner.png" alt="UniSchoolLMS Banner" width="100%" />

  <br />
  <br />

  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white" alt="Celery" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Status-Stable-success?style=for-the-badge" alt="Status" />
</div>

<br />

# UniSchoolLMS - керуй навчанням, а не паперами.

## Можливості системи
Ми не просто написали код, ми створили інструмент, що змінює правила гри:

* **Безпечний доступ** - ваші дані захищені сучасним стандартом шифрування та JWT-авторизацією. Ролі чітко розмежовані.
* **Блискавична аналітика** - знаходьте потрібні оцінки та генеруйте звіти успішності за лічені секунди завдяки оптимізованій базі даних та кешуванню.
* **Розумний пошук та фільтрація** - орієнтуйтеся в сотнях учнів без затримок.
* **Доступ звідусіль** - адаптивний інтерфейс дозволяє комфортно працювати як зі смартфона в дорозі, так і з робочого ноутбука.

## Розгортання (Локальний запуск)

Проєкт (і Frontend, і Backend) запускається повністю через Docker за допомогою єдиного файлу `docker-compose.yml`.

### Крок 1: Налаштування змінних середовища (.env)
Вам потрібно створити файли змінних середовища для обох частин системи.

1. **Для Backend (`api/`):**
   Скопіюйте приклад та за необхідності змініть дані:
   ```bash
   cp api/.env.example api/.env
   ```

2. **Для Frontend (`front/`):**
   Створіть файл `front/.env` (або `.env.local`) з наступними обов'язковими змінними:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Google Інтеграція (`client_secret.json`):**
   Для повноцінної роботи бекенду вам знадобиться файл ключів `client_secret.json`. Завантажте його та покладіть у папку `api/`.
   - [Завантажити client_secret.json з Google Drive](https://drive.google.com/file/d/13UajZEdge9EVilDIijBtojItlN7WsQP-/view?usp=sharing)

### Крок 2: Запуск контейнерів
Запустіть проєкт безпосередньо з кореня репозиторію:
```bash
docker compose up --build -d
```
*(Або перейдіть у `api/` і запустіть `docker compose up --build -d`)*

Система автоматично:
- Завантажить та запустить базу даних (PostgreSQL), Redis та Celery-воркери.
- Виконає міграції та завантажить базові дані (fixtures) через скрипт `entrypoint.sh`.
- Підніме Backend API (буде доступний на `http://localhost:8000`).
- Підніме Frontend застосунок (буде доступний на `http://localhost:3000`).

---

## Дебаг та вирішення проблем (Technical Details)

### System Integrity та База Даних
- **Seed-дані (Fixtures):** При першому запуску `docker-compose up` база даних автоматично ініціалізується тестовими даними. Це налаштовано в скрипті `entrypoint.sh`.
- **Очищення середовища:** Для перевірки працездатності на повністю чистому середовищі (без залишків старих Docker-томів), використовуйте команду:
  ```bash
  docker-compose down -v
  ```
- **Параметри підключення БД:** Обов'язково перевірте файл `api/.env.example`. Змінні `DB_NAME`, `DB_USER`, `DB_PASSWORD` та `DB_HOST` повинні суворо відповідати налаштуванням PostgreSQL у вашому `docker-compose.yml`.

### Можливі проблеми (Debug кроки)
- **Помилка виконання `entrypoint.sh` (Windows):** Якщо виникає помилка при старті Docker контейнерів через `entrypoint.sh`, переконайтесь, що файл збережено з перенесенням рядків формату **LF**, а не CRLF. Це можна легко змінити в більшості редакторів коду (наприклад, у VS Code в правому нижньому куті).
- **Змінні середовища:** Переконайтесь, що ви налаштували обидва `.env` файли перед запуском контейнерів.

### Приклади Environment змінних (базові не критичні змінні)

**Frontend (наприклад, `.env` або `.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Backend `.env`:**
```env
DJANGO_DEBUG=True
DB_NAME=unischool
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=db
DB_PORT=5432
CELERY_BROKER_URL=redis://redis:6379/0
```

## 🗂️ Project Resources (Фінальні результати Етапу 7)

Усі матеріали розроблені та зібрані відповідно до вимог маркетингової упаковки:

* **Marketing Kit (Брендинг, Стратегія, Копірайтинг):** [docs/marketing_kit/](docs/marketing_kit/)
* **Продуктовий промо-ролик (Product Teaser):** [docs/marketing_kit/video/product_promo_video.mp4](docs/marketing_kit/video/product_promo_video.mp4)
* **Демо-відео системи (Backup Video):** [docs/marketing_kit/video/backup_demo_video.mp4](docs/marketing_kit/video/backup_demo_video.mp4)
* **Акаунти для тестування (Demo Credentials):** [docs/demo_credentials.md](docs/demo_credentials.md)
* **Фінальний звіт (Handover Report):** [docs/handover_report.md](docs/handover_report.md)

---

## Лабораторна робота №3: Розгортання застосунку в Kubernetes

### Опис та Архітектура розгортання в Kubernetes
Проєкт розгортається в локальному кластері Kubernetes (Minikube) у виділеному просторі імен `unischool`.
Усі маніфести зберігаються у директорії `k8s/` за принципом один об'єкт на файл:
- `k8s/00-namespace.yaml` — виділений Namespace `unischool`.
- `k8s/01-secret.yaml` — Secret `unischool-secret` (пароль до бази даних, секретний ключ Django).
- `k8s/02-configmap.yaml` — ConfigMap `unischool-config` (параметри підключення до БД, хости, порт, debug-режим, celery broker, frontend url).
- `k8s/03-postgres-pvc.yaml` — PersistentVolumeClaim `postgres-pvc` для збереження даних PostgreSQL.
- `k8s/04-postgres-deployment.yaml` — Deployment бази даних PostgreSQL (`unischool-db`).
- `k8s/05-postgres-service.yaml` — Service типу ClusterIP для внутрішнього доступу до PostgreSQL.
- `k8s/06-redis-deployment.yaml` — Deployment брокера/кешу Redis (`unischool-redis`).
- `k8s/07-redis-service.yaml` — Service типу ClusterIP для доступу до Redis.
- `k8s/08-api-deployment.yaml` — Deployment бекенд-застосунку `unischool-api` (2 репліки, liveness/readiness проби, requests/limits, initContainer для очікування БД).
- `k8s/09-api-service.yaml` — Service типу NodePort (порт `30080`) для доступу з хоста та зсередини кластера.
- `k8s/10-ingress.yaml` — Ingress для маршрутизації доменного імені `unischool.local`.

### Параметри конфігурації (ConfigMap та Secret)
#### ConfigMap (`unischool-config`):
- `DB_NAME`: ім'я бази даних (`unischool`).
- `DB_USER`: користувач бази даних (`postgres`).
- `DB_HOST`: хост підключення до БД всередині кластера (`unischool-db`).
- `DB_PORT`: порт БД (`5432`).
- `DJANGO_DEBUG`: прапорець налагодження (`True`).
- `CELERY_BROKER_URL`: URL підключення до Redis (`redis://unischool-redis:6379/0`).
- `FRONTEND_URL`: базова адреса фронтенду (`http://localhost:3000`).

#### Secret (`unischool-secret`):
- `DB_PASSWORD`: пароль користувача бази даних (`unischool_secure_postgres_pass_2026`).
- `DJANGO_SECRET`: секретний ключ Django (`django-insecure-unischool-k8s-lab3-key-2026`).

### Порядок розгортання з нуля
1. Запуск кластера Minikube та увімкнення розширень:
   ```bash
   minikube start --driver=docker
   minikube addons enable metrics-server
   minikube addons enable ingress
   ```

2. Завантаження образів застосунку в Minikube:
   ```bash
   minikube image load unischool-api:1.0.0
   minikube image load unischool-api:1.1.0
   ```

3. Розгортання всіх ресурсів однією командою з каталогу `k8s/`:
   ```bash
   kubectl apply -f k8s/
   ```

4. Перевірка статусу подів та сервісів:
   ```bash
   kubectl get pods -n unischool
   kubectl get svc -n unischool
   ```

5. Доступ до застосунку:
   - Через NodePort: `http://localhost:30080` (або `http://<minikube-ip>:30080`)
   - Перевірка health-чеку: `http://localhost:30080/health/`
   - Перевірка Swagger UI: `http://localhost:30080/schema/swagger/`

## Подяки
Автор висловлює щиру подяку кабачку за моральну підтримку під час виконання цієї лабораторної роботи.
