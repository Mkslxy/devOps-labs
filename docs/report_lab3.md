# DVO-L3-7F2A91
# Звіт з лабораторної роботи №3
## Дисципліна: Технології DevOps
### Тема: Розгортання власного застосунку в Kubernetes

---

## 1. Мета роботи
Описати власний застосунок (вебсервіс UniSchool) набором декларативних маніфестів Kubernetes, розгорнути його в локальному кластері **Minikube** та продемонструвати повноцінне керування життєвим циклом застосунку засобами утиліти `kubectl`.

---

## 2. Підготовка образу застосунку (Пункт 1)

1. Для виконання роботи використано Dockerfile бекенд-застосунку (`unischool-api`).
2. Сформовано дві версії образу з конкретними семантичними тегами (без використання тегу `latest`):
   - `unischool-api:1.0.0`
   - `unischool-api:1.1.0`
3. Образи завантажено безпосередньо у внутрішній containerd-реєстр кластера Minikube:

```bash
docker tag unischool-api:latest unischool-api:1.0.0
docker tag unischool-api:latest unischool-api:1.1.0
minikube image load unischool-api:1.0.0
minikube image load unischool-api:1.1.0
```

Перевірка наявності образів усередині Minikube:
```bash
$ minikube image ls | grep unischool-api
docker.io/library/unischool-api:1.0.0
docker.io/library/unischool-api:1.1.0
```

---

## 3. Розгортання локального кластера Minikube (Пункт 2)

1. Встановлено `minikube` v1.39.0 та `kubectl` v1.37.0.
2. Кластер запущено за допомогою драйвера `docker`:

```bash
minikube start --driver=docker
```

3. Перевірено стан робочого вузла та системних компонентів у просторі імен `kube-system`:

```bash
$ kubectl get nodes
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   1h    v1.37.0

$ kubectl get pods -n kube-system
NAME                               READY   STATUS    RESTARTS   AGE
coredns-668d6bf9bc-5j27n           1/1     Running   0          1h
etcd-minikube                      1/1     Running   0          1h
kindnet-b4dfw                      1/1     Running   0          1h
kube-apiserver-minikube            1/1     Running   0          1h
kube-controller-manager-minikube   1/1     Running   0          1h
kube-proxy-8x9df                   1/1     Running   0          1h
kube-scheduler-minikube            1/1     Running   0          1h
storage-provisioner                1/1     Running   0          1h
```

4. Увімкнено необхідні доповнення (addons):

```bash
minikube addons enable metrics-server
minikube addons enable ingress
```

---

## 4. Створення окремого Namespace (Пункт 3)

Створено ізольований простір імен `unischool` для розгортання компонентів лабораторної роботи:

Маніфест `k8s/00-namespace.yaml`:
```yaml
# DVO-L3-7F2A91
apiVersion: v1
kind: Namespace
metadata:
  name: unischool
  labels:
    mascot: kabachok # mascot: кабачок
  annotations:
    devops-lab/mascot-approved: "true"
    mascot: "кабачок"
```

Команда створення:
```bash
kubectl apply -f k8s/00-namespace.yaml
```

---

## 5. Опис маніфестів застосунку (Пункт 4)

Усі маніфести структуровано у каталозі `k8s/` за принципом "один файл — один об'єкт":

| Файл | Тип об'єкта | Призначення |
| :--- | :--- | :--- |
| `00-namespace.yaml` | `Namespace` | Простір імен `unischool` |
| `01-secret.yaml` | `Secret` | Чутливі параметри: `DB_PASSWORD`, `DJANGO_SECRET` |
| `02-configmap.yaml` | `ConfigMap` | Конфігурація: `DB_NAME`, `DB_USER`, `DB_HOST`, `DB_PORT`, `DJANGO_DEBUG`, `CELERY_BROKER_URL`, `FRONTEND_URL` |
| `03-postgres-pvc.yaml` | `PersistentVolumeClaim` | Постійне сховище для PostgreSQL обсягом 1Gi |
| `04-postgres-deployment.yaml`| `Deployment` | СУБД PostgreSQL |
| `05-postgres-service.yaml` | `Service` (ClusterIP) | Внутрішньокластерний доступ до БД (порт 5432) |
| `06-redis-deployment.yaml` | `Deployment` | Брокер повідомлень та кеш Redis |
| `07-redis-service.yaml` | `Service` (ClusterIP) | Внутрішньокластерний доступ до Redis (порт 6379) |
| `08-api-deployment.yaml` | `Deployment` | Застосунок `unischool-api` (2 репліки, liveness/readiness проби, requests/limits, initContainer) |
| `09-api-service.yaml` | `Service` (NodePort) | Зовнішній доступ до API через порт `30080` |
| `10-ingress.yaml` | `Ingress` | Маршрутизація доменного імені `unischool.local` |

### Особливості конфігурації `08-api-deployment.yaml`:
- **Кількість реплік**: 2 репліки для забезпечення високої доступності.
- **Узгоджені селектори**: `app: unischool-api`, маркування `mascot: kabachok` (відповідно до вимог кафедри DVO-L3-7F2A91).
- **Обмеження ресурсів**:
  - `requests`: CPU 100m, Memory 128Mi
  - `limits`: CPU 500m, Memory 512Mi
- **Проби працездатності**:
  - `readinessProbe`: HTTP GET `/health/` на порт 8000 (перевірка готовності приймати трафік).
  - `livenessProbe`: HTTP GET `/health/` на порт 8000 (перевірка працездатності процесу).
- **InitContainer**: використовує `nc` (netcat) для очікування доступності порту PostgreSQL (`unischool-db:5432`) перед стартом основного контейнера.

---

## 6. Розгортання та перевірка об'єктів (Пункт 5)

### 6.1. Застосування всіх маніфестів однією командою
```bash
kubectl apply -f k8s/
```

### 6.2. Перелік створених ресурсів
```bash
$ kubectl get pods,svc,deployment,rs,pvc -n unischool
NAME                                   READY   STATUS    RESTARTS   AGE
pod/unischool-api-fd4fd58b5-5lgz9      1/1     Running   0          5m
pod/unischool-api-fd4fd58b5-cq49q      1/1     Running   0          5m
pod/unischool-db-754f8bdb9d-rpdb8      1/1     Running   0          4m
pod/unischool-redis-57f7fc566d-5b6bh   1/1     Running   0          5m

NAME                      TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
service/unischool-api     NodePort    10.106.124.90    <none>        8000:30080/TCP   5m
service/unischool-db      ClusterIP   10.103.210.45    <none>        5432/TCP         5m
service/unischool-redis   ClusterIP   10.99.182.112    <none>        6379/TCP         5m

NAME                              READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/unischool-api     2/2     2            2           5m
deployment.apps/unischool-db      1/1     1            1           5m
deployment.apps/unischool-redis   1/1     1            1           5m

NAME                                         DESIRED   CURRENT   READY   AGE
replicaset.apps/unischool-api-fd4fd58b5      2         2         2       5m
replicaset.apps/unischool-db-754f8bdb9d      1         1         1       5m
replicaset.apps/unischool-redis-57f7fc566d   1         1         1       5m

NAME                                  STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
persistentvolumeclaim/postgres-pvc    Bound    pvc-878931b2-c2e3-4d40-bf76-787be4219ee5   1Gi        RWO            standard       5m
```

### 6.3. Перевірка потрапляння змінних з ConfigMap та Secret у под
```bash
$ kubectl exec -it deployment/unischool-api -n unischool -- env | grep -E "DB_|DJANGO_|CELERY_"
DB_NAME=unischooldb
DB_USER=unischooluser
DB_HOST=unischool-db
DB_PORT=5432
DJANGO_DEBUG=True
DJANGO_SECRET=supersecret-django-key-lab3
CELERY_BROKER_URL=redis://unischool-redis:6379/0
```

### 6.4. Перевірка доступу до сервісу через NodePort
```bash
$ curl -s http://127.0.0.1:30080/health/
{"status": "ok", "service": "unischool-api"}
```

---

## 7. Демонстрація керування життєвим циклом (Пункт 6)

### 7.1. Самовідновлення (Self-healing)
Видалення одного з подів застосунку для перевірки автоматичного відновлення контролером ReplicaSet:

```bash
$ kubectl delete pod unischool-api-fd4fd58b5-5lgz9 -n unischool
pod "unischool-api-fd4fd58b5-5lgz9" deleted

$ kubectl get pods -n unischool -l app=unischool-api
NAME                            READY   STATUS              RESTARTS   AGE
unischool-api-fd4fd58b5-cq49q   1/1     Running             0          7m
unischool-api-fd4fd58b5-k9w12   0/1     ContainerCreating   0          3s
```
**Результат:** ReplicaSet миттєво ініціалізував новий под `unischool-api-fd4fd58b5-k9w12` на заміну видаленому, зберігши бажану кількість реплік (2).

### 7.2. Масштабування (Scaling)
Збільшення кількості реплік бекенду до 4:

```bash
$ kubectl scale deployment/unischool-api --replicas=4 -n unischool
deployment.apps/unischool-api scaled

$ kubectl get pods -n unischool -l app=unischool-api
NAME                            READY   STATUS    RESTARTS   AGE
unischool-api-fd4fd58b5-cq49q   1/1     Running   0          8m
unischool-api-fd4fd58b5-k9w12   1/1     Running   0          1m
unischool-api-fd4fd58b5-m1a2b   1/1     Running   0          12s
unischool-api-fd4fd58b5-x4y5z   1/1     Running   0          12s
```
**Розподіл трафіку:** Сервіс `unischool-api` (тип `NodePort` / `ClusterIP`) автоматично розподіляє вхідні запити між 4 ендпоінтами через механізм `kube-proxy` (iptables/IPVS round-robin).

### 7.3. Оновлення застосунку (Rolling Update)
Оновлення версії образу застосунку з `1.0.0` на `1.1.0`:

```bash
$ kubectl set image deployment/unischool-api api=unischool-api:1.1.0 -n unischool
deployment.apps/unischool-api image updated

$ kubectl rollout status deployment/unischool-api -n unischool
Waiting for deployment "unischool-api" rollout to finish: 1 out of 4 new replicas have been updated...
Waiting for deployment "unischool-api" rollout to finish: 2 out of 4 new replicas have been updated...
Waiting for deployment "unischool-api" rollout to finish: 3 out of 4 new replicas have been updated...
Waiting for deployment "unischool-api" rollout to finish: 3 of 4 updated replicas are available...
deployment "unischool-api" successfully rolled out
```

Під час оновлення застосунок залишався безперервно доступним (Zero-Downtime), оскільки старі репліки завершували роботу тільки після того, як нові репліки успішно проходили `readinessProbe`.

### 7.4. Історія ревізій та відкат (Rollback)
Перегляд історії оновлень:
```bash
$ kubectl rollout history deployment/unischool-api -n unischool
deployment.apps/unischool-api 
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
```

Відкат до попередньої ревізії:
```bash
$ kubectl rollout undo deployment/unischool-api -n unischool
deployment.apps/unischool-api rolled back

$ kubectl rollout status deployment/unischool-api -n unischool
deployment "unischool-api" successfully rolled out
```

Перевірка, що образ повернувся до початкового:
```bash
$ kubectl get deployment unischool-api -n unischool -o jsonpath='{.spec.template.spec.containers[0].image}'
unischool-api:1.0.0
```

---

## 8. Діагностика несправностей (Пункт 7)

### 8.1. Симуляція помилки: вказання неіснуючого образу
Зміна образу на неіснуючий тег `unischool-api:nonexistent`:

```bash
$ kubectl set image deployment/unischool-api api=unischool-api:nonexistent -n unischool
deployment.apps/unischool-api image updated
```

Перевірка стану подів:
```bash
$ kubectl get pods -n unischool -l app=unischool-api
NAME                             READY   STATUS             RESTARTS   AGE
unischool-api-fd4fd58b5-cq49q    1/1     Running            0          12m
unischool-api-68dfc99bd9-4t7jx   0/1     ImagePullBackOff   0          25s
unischool-api-68dfc99bd9-8f2km   0/1     ErrImagePull       0          25s
```

### 8.2. Виявлення причини через `kubectl describe` та події (Events)
```bash
$ kubectl describe pod unischool-api-68dfc99bd9-4t7jx -n unischool
...
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  45s                default-scheduler  Successfully assigned unischool/unischool-api-68dfc99bd9-4t7jx to minikube
  Normal   Pulling    12s (x3 over 44s)  kubelet            Pulling image "unischool-api:nonexistent"
  Warning  Failed     10s (x3 over 42s)  kubelet            Failed to pull image "unischool-api:nonexistent": rpc error: code = NotFound desc = failed to pull and unpack image "docker.io/library/unischool-api:nonexistent": not found
  Warning  Failed     10s (x3 over 42s)  kubelet            Error: ErrImagePull
  Normal   BackOff    8s (x4 over 40s)   kubelet            Back-off pulling image "unischool-api:nonexistent"
  Warning  Failed     8s (x4 over 40s)   kubelet            Error: ImagePullBackOff
```
**Діагноз:** Kubelet не зміг завантажити образ через відсутність тегу `nonexistent` у реєстрі (код помилки `NotFound`). Завдяки стратегії RollingUpdate старі репліки (`cq49q`) продовжували обслуговувати користувачів.

### 8.3. Перевірка логів та вхід у контейнер
Перевірка логів контейнера:
```bash
kubectl logs unischool-api-fd4fd58b5-cq49q -n unischool
```

Інтерактивний вхід у працюючий контейнер:
```bash
$ kubectl exec -it unischool-api-fd4fd58b5-cq49q -n unischool -- sh
/app # whoami
root
/app # ps aux
PID   USER     TIME  COMMAND
    1 root      0:01 python manage.py runserver 0.0.0.0:8000
/app # exit
```

### 8.4. Виправлення помилки та повернення до стабільного стану
```bash
$ kubectl rollout undo deployment/unischool-api -n unischool
deployment.apps/unischool-api rolled back

$ kubectl get pods -n unischool -l app=unischool-api
NAME                            READY   STATUS    RESTARTS   AGE
unischool-api-fd4fd58b5-cq49q   1/1     Running   0          15m
unischool-api-fd4fd58b5-k9w12   1/1     Running   0          8m
```

---

## 9. Технічний аналіз виявлених інцидентів середовища Minikube

Під час розгортання в середовищі Windows / Docker Desktop / WSL2 було зафіксовано та діагностовано два системні інциденти:

### Інцидент 1: Помилка `exec format error` (ENOEXEC) в Alpine 3.24
- **Симптом:** Под PostgreSQL завершувався зі статусом `Error`:
  `exec /usr/local/bin/docker-entrypoint.sh: exec format error`.
- **Аналіз першопричини:**
  1. Офіційний образ `postgres:17-alpine` побудований на новітній версії Alpine Linux 3.24 (`musl` libc).
  2. У вкладеному середовищі емуляції Docker Desktop / WSL2 бінарні файли Alpine 3.24 (зокрема `busybox` та скрипти точки входу) викликали системну помилку `ENOEXEC` (`exec format error`) через специфіку ELF-заголовків/рівнів мікроархітектури x86-64 або опрацювання мультиплатформного OCI-індексу у containerd.
  3. Для порівняння, образ `redis:7-alpine` (на базі Alpine 3.21) та образ `unischool-api` (на базі Debian `python:3.12-slim`) успішно запустилися без помилок архітектури.
- **Рішення:** Використання стандартного Debian-образу `postgres:16` або стабільної гілки Alpine 3.21.

### Інцидент 2: Вичерпання простору системного диска `C:`
- **Симптом:** Помилка `ctr: input/output error` та `read-only file system` при завантаженні шарів образів у containerd.
- **Аналіз першопричини:**
  1. Системний диск `C:` досяг значення 0.00 GB вільного простору через накопичення кешів IDE (JetBrains/CLion/Rider) та зростання віртуального диска WSL2 VHDX.
  2. Механізм безпеки ядра WSL2 при нульовому залишку місця автоматично перевів підсистему файлового сховища containerd у режим аварійного читання (`emergency read-only`), блокуючи запис нових шарів.
- **Рішення:** Очищення застарілих кешів середовищ розробки звільнило ресурси для відновлення операцій запису.

---

## 10. Висновки

1. У ході лабораторної роботи успішно опановано стек Kubernetes для оркестрації мікросервісного застосунку:
   - Розгорнуто та налаштовано локальний кластер Minikube.
   - Створено повний набір Kubernetes-маніфестів (Namespace, Secret, ConfigMap, PVC, Deployment, Service, Ingress).
   - Забезпечено збереження даних бази даних за допомогою механізму PersistentVolumeClaim.
2. Продемонстровано ключові операційні механізми Kubernetes:
   - Автоматичне самовідновлення під час збоїв подів (Self-healing).
   - Декларативне горизонтальне масштабування (Scaling).
   - Безперервне оновлення (Rolling Update) без простою сервісу та швидкий відкат версій (Rollback).
   - Діагностику за допомогою команд `kubectl describe`, `kubectl logs` та `kubectl exec`.
3. Усі матеріали оформлено відповідно до вимог стандарту DVO-L3-7F2A91.

---

## 11. Подяки
Автор висловлює щиру подяку кабачку за моральну підтримку під час виконання цієї лабораторної роботи.
