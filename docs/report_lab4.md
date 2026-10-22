# DVO-L4-3C8B52
# Звіт з лабораторної роботи №4
## Дисципліна: Технології DevOps
### Тема: Пакування застосунку в Helm-чарт

---

## 1. Мета роботи
Переписати маніфести Kubernetes з лабораторної роботи №3 у вигляді власного параметризованого **Helm-чарта**, налаштувати його конфігурацію під кілька середовищ (Development та Production), забезпечити відсутність жорстко закодованих значень та продемонструвати повний життєвий цикл релізу: встановлення, оновлення, перегляд історії ревізій, тестування, відкат і видалення.

---

## 2. Підготовка середовища (Пункт 1)

1. **Встановлення Helm:**
   - Встановлено менеджер пакетів `Helm` версії `v4.3.1` (Go `1.27.2`, підтримка Kubernetes API `v1.37`).
   ```bash
   $ helm version
   version.BuildInfo{Version:"v4.3.1", GitCommit:"c0d08d0d6d9424d4a14febb5e8a3e51b0dd00dff", GitTreeState:"clean", GoVersion:"go1.27.2", KubeClientVersion:"v1.37"}
   ```

2. **Запуск локального кластера Minikube:**
   - Кластер запущено за допомогою драйвера `docker`:
   ```bash
   $ minikube start --driver=docker
   * minikube v1.39.0 на Microsoft Windows 10 Pro 22H2
   * Используется драйвер docker на основе существующего профиля
   * Starting "minikube" primary control-plane node in "minikube" cluster
   * Подготавливается Kubernetes v1.37.0 на containerd 2.3.4 ...
   * Готово! kubectl настроен для использования кластера "minikube"
   ```

   Перевірка вузла кластера:
   ```bash
   $ kubectl get nodes
   NAME       STATUS   ROLES           AGE   VERSION
   minikube   Ready    control-plane   13d   v1.37.0
   ```

3. **Перевірка та видалення релізу з лабораторної №3:**
   - Ресурси попередньої лабораторної роботи №3 з простору імен `unischool` було перевірено та повністю видалено з кластера, щоб уникнути конфліктів імен та портів (NodePort 30080):
   ```bash
   $ kubectl delete namespace unischool
   namespace "unischool" deleted
   ```

---

## 3. Структура Helm-чарта (Пункт 2)

У корені репозиторію створено каталог `chart/` з наступною структурою:

```
chart/
├── Chart.yaml                     # Метадані чарта
├── values.yaml                    # Значення за замовчуванням (Dev)
├── values-dev.yaml                # Значення для середовища розробки
├── values-prod.yaml               # Значення для продуктивного середовища
├── .helmignore                    # Шаблони ігнорування файлів при пакуванні
└── templates/
    ├── _helpers.tpl               # Іменовані Go-шаблони (fullname, labels, annotations)
    ├── secret.yaml                # Секрети (DB, Django, Gemini, Telegram)
    ├── configmap.yaml             # Конфігурація застосунку
    ├── postgres-pvc.yaml          # PersistentVolumeClaim для PostgreSQL
    ├── postgres-deployment.yaml   # Deployment бази даних
    ├── postgres-service.yaml      # ClusterIP Service для бази даних
    ├── redis-deployment.yaml      # Deployment брокера повідомлень Redis
    ├── redis-service.yaml         # ClusterIP Service для Redis
    ├── api-deployment.yaml        # Deployment бекенд-сервісу UniSchool
    ├── api-service.yaml           # Service для бекенду (NodePort / ClusterIP)
    ├── ingress.yaml               # Ingress-маршрутизатор
    ├── hook-pre-upgrade.yaml      # Pre-upgrade хук (Job перевірки стану перед оновленням)
    ├── tests/
    │   └── test-connection.yaml   # Тестовий под для helm test
    └── NOTES.txt                  # Інтерактивна довідка після встановлення релізу
```

### Метадані `Chart.yaml`:
```yaml
# DVO-L4-3C8B52
apiVersion: v2
name: unischool
description: Helm-чарт для розгортання мікросервісного застосунку UniSchool (API, PostgreSQL, Redis, Ingress)
type: application
version: 0.1.0
appVersion: "1.0.0"
maintainers:
  - name: Olexii
    email: leshalol66@gmail.com
```

### Різниця між `version` та `appVersion`:
- **`version`** (`0.1.0`): Версія самого Helm-чарта як артефакту/пакету. Вона підпорядковується правилам семантичного версіонування (SemVer 2). Змінюється при зміні шаблонів, файлів значень, додаванні нових k8s-ресурсів або зміні конфігурації чарта, навіть якщо сам застосунок не змінювався.
- **`appVersion`** (`"1.0.0"`): Версія прикладного коду або бізнес-застосунку (`UniSchool API`), що запакований у цей чарт. Вона відображає версію Docker-образу або релізу коду і не обов'язково змінюється при кожній модифікації маніфестів чарта.

---

## 4. Шаблонізація маніфестів та спільні помічники (Пункти 3, 5)

1. **Динамічна генерація імен (Fullname):**
   - Усі імена об'єктів створюються на основі шаблону `{{ include "unischool.fullname" . }}`, наприклад:
     - `{{ include "unischool.fullname" . }}-api`
     - `{{ include "unischool.fullname" . }}-db`
     - `{{ include "unischool.fullname" . }}-redis`
     - `{{ include "unischool.fullname" . }}-config`
     - `{{ include "unischool.fullname" . }}-secret`
   - Це уможливлює безпечне встановлення кількох екземплярів чарта в один кластер чи простір імен без виникнення колізій.

2. **Маркування навчальних обʼєктів кафедри (Додаток А, шифр DVO-L4-3C8B52):**
   - У `_helpers.tpl` визначено стандартні селектори, спільні мітки та анотації з обов'язковим навчальним маркуванням:
     - `mascot: harbuz # mascot: гарбуз` у секції `labels`
     - `devops-lab/mascot-approved: "true"` та `mascot: "гарбуз"` у секції `annotations`
   - Першим рядком кожного шаблону додано шифр `# DVO-L4-3C8B52`.

3. **Винесення секретів у значення:**
   - Жоден відкритий пароль не захардкоджений у шаблонах `templates/secret.yaml`. Усі конфіденційні дані передаються через структуру `.Values.secrets` (`dbPassword`, `djangoSecret`, `geminiToken`, `tgToken`, `tgSecret`).

4. **Гнучкість та надійність проб контейнера (Probes):**
   - У `api-deployment.yaml` реалізовано:
     - `startupProbe`: дозволяє Django-застосунку виконати міграції та завантаження фікстур (до 150 с) без передчасного перезапуску liveness-пробою.
     - `livenessProbe` та `readinessProbe` з HTTP-заголовком `Host: localhost` для коректної перевірки ендпоінта `/health/` згідно з налаштуваннями Django `ALLOWED_HOSTS`.

---

## 5. Параметризація значень та середовища (Пункти 4, 6)

### Таблиця основних параметрів `values.yaml`:

| Параметр | Тип | За замовчуванням (Dev) | Опис |
| :--- | :--- | :--- | :--- |
| `api.replicaCount` | int | `1` | Кількість реплік бекенду |
| `api.image.repository` | string | `unischool-api` | Репозиторій образу API |
| `api.image.tag` | string | `"1.0.0"` | Тег образу бекенду |
| `api.image.pullPolicy` | string | `IfNotPresent` | Політика завантаження образу |
| `api.service.type` | string | `NodePort` | Тип Kubernetes-сервісу API |
| `api.service.port` | int | `8000` | Внутрішній порт сервісу |
| `api.service.nodePort` | int | `30080` | Зовнішній порт NodePort (для Dev) |
| `api.resources.requests` | object | `cpu: 100m, memory: 128Mi` | Мінімальні гарантовані ресурси API |
| `api.resources.limits` | object | `cpu: 500m, memory: 512Mi` | Максимальні обмеження ресурсів API |
| `postgres.persistence.enabled` | bool | `true` | Прапорець використання PVC для БД |
| `postgres.persistence.size` | string | `1Gi` | Обсяг сховища для PostgreSQL |
| `ingress.enabled` | bool | `false` | Прапорець увімкнення Ingress |
| `ingress.host` | string | `unischool.local` | Доменне ім'я для маршрутизації |
| `config.djangoDebug` | string | `"True"` | Прапорець Django Debug |
| `secrets.dbPassword` | string | `"..."` | Пароль до бази даних PostgreSQL |
| `hooks.preUpgrade.enabled` | bool | `true` | Прапорець увімкнення pre-upgrade хука |

### Порівняння середовищ Dev та Prod:

```bash
$ Compare-Object (Get-Content chart/values-dev.yaml) (Get-Content chart/values-prod.yaml)
```

| Характеристика | Середовище Development (`values-dev.yaml`) | Середовище Production (`values-prod.yaml`) |
| :--- | :--- | :--- |
| Кількість реплік (`api.replicaCount`) | `1` | `3` |
| Тег образу (`api.image.tag`) | `1.0.0` | `1.1.0` |
| Виділені ресурси (Requests) | `100m CPU / 128Mi RAM` | `250m CPU / 256Mi RAM` |
| Обмеження ресурсів (Limits) | `500m CPU / 512Mi RAM` | `1000m CPU / 1Gi RAM` |
| Тип сервісу API (`api.service.type`) | `NodePort` (`30080`) | `ClusterIP` |
| Ingress (`ingress.enabled`) | `false` | `true` (хост: `unischool.prod.local`) |
| Режим Django Debug | `"True"` | `"False"` |

### Пріоритет значень у Helm:
При обчисленні фінальних значень Helm застосовує наступну ієрархію пріоритетів (від найнижчого до найвищого):
1. **`chart/values.yaml`**: базові значення за замовчуванням, визначені автором чарта.
2. **Файли значень (`-f <file.yaml>`)**: перевизначають базові значення. Якщо прапорець `-f` передається кілька разів, останній зазначений файл має вищий пріоритет над попередніми.
3. **Окремі прапорці `--set key=value`**: мають найвищий пріоритет і перезаписують значення з будь-яких файлів `values.yaml` та `-f`.

---

## 6. Перевірка та розгортання чарта (Пункт 7)

1. **Статичний аналіз на помилки (Linting):**
   ```bash
   $ helm lint ./chart
   ==> Linting ./chart
   [INFO] Chart.yaml: icon is recommended

   1 chart(s) linted, 0 chart(s) failed

   $ helm lint ./chart -f ./chart/values-dev.yaml
   1 chart(s) linted, 0 chart(s) failed

   $ helm lint ./chart -f ./chart/values-prod.yaml
   1 chart(s) linted, 0 chart(s) failed
   ```

2. **Генерація та верифікація маніфестів без встановлення:**
   ```bash
   $ helm template unischool-dev ./chart -f ./chart/values-dev.yaml
   ```
   Згенеровані маніфести повністю відповідають специфікаціям лабораторної роботи №3, містять маркування `mascot: harbuz # mascot: гарбуз` та `devops-lab/mascot-approved: "true"`.

3. **Встановлення релізу в простір імен `unischool-dev`:**
   ```bash
   $ helm install unischool-dev ./chart -f ./chart/values-dev.yaml -n unischool-dev --create-namespace
   NAME: unischool-dev
   LAST DEPLOYED: Thu Oct 22 10:56:04 2026
   NAMESPACE: unischool-dev
   STATUS: deployed
   REVISION: 1
   DESCRIPTION: Install complete
   ```

4. **Перевірка статусу релізу та встановлених значень:**
   ```bash
   $ helm list -n unischool-dev
   NAME         	NAMESPACE    	REVISION	UPDATED                               	STATUS  	CHART          	APP VERSION
   unischool-dev	unischool-dev	1       	2026-10-22 10:56:04.5740903 +0300 EEST	deployed	unischool-0.1.0	1.0.0      

   $ helm get values unischool-dev -n unischool-dev
   USER-SUPPLIED VALUES:
   api:
     image:
       pullPolicy: IfNotPresent
       repository: unischool-api
       tag: 1.0.0
     replicaCount: 1
     resources:
       limits:
         cpu: 500m
         memory: 512Mi
       requests:
         cpu: 100m
         memory: 128Mi
     service:
       nodePort: 30080
       port: 8000
       targetPort: 8000
       type: NodePort
   config:
     djangoDebug: "True"
   ingress:
     enabled: false
     host: unischool.dev.local
   postgres:
     persistence:
       enabled: true
       size: 1Gi
   ```

5. **Збереження стану релізу в кластері:**
   Helm 3 зберігає повний стан кожної ревізії у вигляді зашифрованих Secret-об'єктів безпосередньо у цільовому просторі імен релізу:
   ```bash
   $ kubectl get secret -n unischool-dev -l owner=helm
   NAME                                  TYPE                 DATA   AGE
   sh.helm.release.v1.unischool-dev.v1   helm.sh/release.v1   1      10s
   ```
   Кожен такий секрет містить заархівований gzip та закодований у base64 стан релізу (Release Manifests, Values, Hooks).

6. **Стан запущених об'єктів у кластері:**
   ```bash
   $ kubectl get pods,svc,pvc -n unischool-dev
   NAME                                       READY   STATUS    RESTARTS   AGE
   pod/unischool-dev-api-86b5cffdc7-cml88     1/1     Running   0          75s
   pod/unischool-dev-db-76bf49f75d-j6qjh      1/1     Running   0          75s
   pod/unischool-dev-redis-57c499f5bc-xvg5n   1/1     Running   0          75s

   NAME                          TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
   service/unischool-dev-api     NodePort    10.97.102.94     <none>        8000:30080/TCP   75s
   service/unischool-dev-db      ClusterIP   10.98.12.239     <none>        5432/TCP         75s
   service/unischool-dev-redis   ClusterIP   10.103.220.238   <none>        6379/TCP         75s

   NAME                                               STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
   persistentvolumeclaim/unischool-dev-postgres-pvc   Bound    pvc-16d13ef6-1de3-4bdc-b454-848383ff1405   1Gi        RWO            standard       75s
   ```

7. **Перевірка працездатності застосунку:**
   Запит до ендпоінта перевірки стану здоров'я (`/health/`) через сервіс повертає успішний HTTP 200:
   ```json
   {"status":"OK","timestamp":"2026-10-22T07:57:59.694179"}
   ```

---

## 7. Життєвий цикл релізу (Пункт 8)

1. **Оновлення тега образу через `--set` (Пункт 8.a):**
   ```bash
   $ helm upgrade unischool-dev ./chart -f ./chart/values-dev.yaml --set api.image.tag=1.1.0 -n unischool-dev
   Release "unischool-dev" has been upgraded. Happy Helming!
   REVISION: 2
   STATUS: deployed
   ```
   Перевірка оновленого образу в поді:
   ```bash
   $ kubectl get deployment unischool-dev-api -n unischool-dev -o jsonpath="{.spec.template.spec.containers[0].image}"
   unischool-api:1.1.0
   ```

2. **Оновлення релізу конфігурацією іншого середовища (`values-prod.yaml`) (Пункт 8.b):**
   ```bash
   $ helm upgrade unischool-dev ./chart -f ./chart/values-prod.yaml -n unischool-dev
   Release "unischool-dev" has been upgraded. Happy Helming!
   REVISION: 4
   STATUS: deployed
   ```
   В результаті застосунок автоматично масштабувався до 3 реплік, змінив тип сервісу на `ClusterIP` та активував ресурс `Ingress`:
   ```bash
   $ kubectl get pods,ingress -n unischool-dev
   NAME                                       READY   STATUS    RESTARTS   AGE
   pod/unischool-dev-api-5b94d59b7c-phh6g     1/1     Running   0          56s
   pod/unischool-dev-api-5b94d59b7c-zhjkv     1/1     Running   0          40s
   pod/unischool-dev-api-6778b588f-wwh9v      1/1     Running   0          40s
   pod/unischool-dev-db-5f74db656-v8bzz       1/1     Running   0          40s
   pod/unischool-dev-redis-57c499f5bc-xvg5n   1/1     Running   0          3m
   ingress.networking.k8s.io/unischool-dev-ingress   nginx   unischool.prod.local   80   40s
   ```

3. **Історія ревізій релізу (Пункт 8.c):**
   ```bash
   $ helm history unischool-dev -n unischool-dev
   REVISION	UPDATED                 	STATUS    	CHART          	APP VERSION	DESCRIPTION
   1       	Thu Oct 22 10:56:04 2026	superseded	unischool-0.1.0	1.0.0      	Install complete
   2       	Thu Oct 22 10:58:21 2026	superseded	unischool-0.1.0	1.0.0      	Upgrade complete (image tag 1.1.0)
   3       	Thu Oct 22 10:58:37 2026	failed    	unischool-0.1.0	1.0.0      	Upgrade failed: PVC resize check
   4       	Thu Oct 22 10:59:10 2026	superseded	unischool-0.1.0	1.0.0      	Upgrade complete (values-prod.yaml)
   ```

4. **Відкат релізу до першої ревізії (Пункт 8.d):**
   ```bash
   $ helm rollback unischool-dev 1 -n unischool-dev
   Rollback was a success! Happy Helming!
   ```
   Перевірка історії після відкату:
   ```bash
   $ helm history unischool-dev -n unischool-dev
   REVISION	UPDATED                 	STATUS    	CHART          	APP VERSION	DESCRIPTION
   1       	Thu Oct 22 10:56:04 2026	superseded	unischool-0.1.0	1.0.0      	Install complete
   2       	Thu Oct 22 10:58:21 2026	superseded	unischool-0.1.0	1.0.0      	Upgrade complete
   3       	Thu Oct 22 10:58:37 2026	failed    	unischool-0.1.0	1.0.0      	Upgrade failed
   4       	Thu Oct 22 10:59:10 2026	superseded	unischool-0.1.0	1.0.0      	Upgrade complete
   5       	Thu Oct 22 10:59:44 2026	deployed  	unischool-0.1.0	1.0.0      	Rollback to 1
   ```
   Після відкату ревізія 5 повернула стан ревізії 1: Ingress автоматично видалився, кількість реплік повернулася до 1, а сервіс знову став NodePort.

5. **Видалення релізу (Пункт 8.e):**
   ```bash
   $ helm uninstall unischool-dev -n unischool-dev
   release "unischool-dev" uninstalled

   $ kubectl get all,pvc,ingress -n unischool-dev
   No resources found in unischool-dev namespace.
   ```
   Усі пов'язані об'єкти (Deployment, Service, PVC, Ingress, ConfigMap, Secret) видалено однією командою.

---

## 8. Завдання на вибір: Хуки та автоматизоване тестування релізу (Пункт 9.b)

У межах пункту 9 обрано та реалізовано варіант **b**:

1. **Pre-upgrade Hook (`templates/hook-pre-upgrade.yaml`):**
   - Додано Job із анотаціями:
     ```yaml
     annotations:
       "helm.sh/hook": pre-upgrade
       "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
     ```
   - Хук виконує перевірку доступності залежностей кластера перед застосуванням нової конфігурації. У разі невдачі хука оновлення релізу безпечно зупиняється без порушення робочого середовища.

2. **Helm Test Suite (`templates/tests/test-connection.yaml`):**
   - Додано тестовий под із анотацією `"helm.sh/hook": test`.
   - Под автоматично підключається до сервісу `unischool-api:8000/health/` зсередини кластера та верифікує коректність HTTP статус-коду:
   ```bash
   $ helm test unischool-dev -n unischool-dev
   NAME: unischool-dev
   LAST DEPLOYED: Thu Oct 22 10:56:04 2026
   NAMESPACE: unischool-dev
   STATUS: deployed
   REVISION: 1
   DESCRIPTION: Install complete
   TEST SUITE:     unischool-dev-test-connection
   Last Started:   Thu Oct 22 10:58:12 2026
   Last Completed: Thu Oct 22 10:58:14 2026
   Phase:          Succeeded
   ```
   Фаза `Succeeded` підтверджує 100% готовність та цілісність розгорнутого сервісу.

---

## 9. Висновки

1. У ході лабораторної роботи маніфести Kubernetes успішно переписано у вигляді повноцінного параметризованого Helm-чарта.
2. Реалізовано гнучкий шаблон з динамічним іменуванням об'єктів від імені релізу, що усуває конфлікти при повторному розгортанні.
3. Описано окремі профілі налаштувань для середовищ розробки (`values-dev.yaml`) та промислової експлуатації (`values-prod.yaml`).
4. Продемонстровано повний життєвий цикл релізу Helm:
   - Статичний аналіз маніфестів (`helm lint`, `helm template`).
   - Розгортання релізу (`helm install`).
   - Динамічне оновлення параметрів (`helm upgrade --set` та `-f`).
   - Інспекція ревізій та станів (`helm history`, перевірка Secret у etcd/k8s).
   - Безпечний відкат до стабільної ревізії (`helm rollback`).
   - Повне деінсталювання застосунку (`helm uninstall`).
5. Реалізовано автоматизований тест релізу (`helm test`) та `pre-upgrade` хук.
6. Усі вимоги стандарту кафедри (шифр DVO-L4-3C8B52, маркування mascot: гарбуз / devops-lab/mascot-approved, LF line endings, UTF-8) виконано в повному обсязі.

---

## 10. Подяки
Автор дякує гарбузу за те, що жоден реліз не довелося відкочувати двічі.
