# Звіт з лабораторної роботи №5
## Дисципліна: Технології DevOps
### Тема: GitOps: розгортання проєкту через Argo CD

---

## 1. Мета роботи
Перевести розгортання власного навчального проєкту з ручного виконання команд `helm upgrade --install` на повноцінну **GitOps-модель**, за якої бажаний стан кластера декларативно описаний у Git-репозиторії, а **Argo CD** у кластері Minikube безперервно відстежує зміни та автоматично синхронізує стан кластера із репозиторієм (Single Source of Truth).

---

## 2. Структура репозиторію конфігурації (Пункт 1)

Опис розгортання винесено до версіонованого Git-репозиторію з підтримкою патерну **App of Apps**:

```
devOps-labs/
├── bootstrap/
│   └── root-app.yaml            # Кореневий Argo CD Application (App of Apps)
├── argocd-apps/
│   └── unischool-app.yaml       # Дочірній Application для Helm-чарта проєкту
├── charts/
│   └── unischool/               # Helm-чарт проєкту (з ЛР-4)
│       ├── Chart.yaml
│       ├── values.yaml          # Базові значення
│       ├── values-dev.yaml      # Середовище Dev
│       ├── values-prod.yaml     # Середовище Prod
│       ├── values-minikube.yaml # Значення для Minikube під керуванням Argo CD
│       └── templates/           # Шаблони маніфестів K8s
├── api/                         # Backend-застосунок (Django REST API)
└── .github/workflows/ci.yml     # CI пайплайн (тести, сканування Trivy, пуш у GHCR)
```

Всі конфіденційні дані параметризовані через об'єкт `Secret` у Helm-чарті, а значення за замовчуванням у Git є навчальними/демонстраційними, без витоку виробничих паролів.

---

## 3. Образ застосунку в реєстрі та перевірка версії (Пункт 2)

1. **Публікація образу в GitHub Container Registry (GHCR):**
   - У межах CI/CD пайплайну на GitHub Actions налаштовано автоматичну збірку та публікацію образу:
     `ghcr.io/mkslxy/devops-labs/api`
   - Образ доступний у реєстрі публічно та використовує конкретні версійні теги (`1.0.0`, `2.0.0`, а також коротку SHA коміту `sha-ad2151e`), без використання непередбачуваного `latest`.

2. **Ендпоінти версії та здоров'я:**
   - У `api/apps/core/views.py` реалізовано:
     - `/health/` — повертає статус бази даних, поточний час та версію (`APP_VERSION`).
     - `/version/` — повертає виділений JSON із точною версією та назвою сервісу.

```json
// Відповідь ендпоінта /health/
{
  "status": "OK",
  "version": "1.0.0",
  "timestamp": "2026-10-22T09:02:10.109966"
}

// Відповідь ендпоінта /version/
{
  "version": "1.0.0",
  "service": "unischool-api",
  "timestamp": "2026-10-22T09:02:10.662341"
}
```

---

## 4. Встановлення та налаштування Argo CD (Пункт 3)

1. **Розгортання Argo CD в кластері Minikube:**
   - Створено виділений namespace `argocd`.
   - Встановлено стабільний реліз Argo CD через офіційні маніфести:
   ```bash
   kubectl create namespace argocd
   kubectl apply -n argocd --server-side --force-conflicts -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   ```

2. **Стан компонентів Argo CD:**
   ```bash
   $ kubectl get pods -n argocd
   NAME                                                READY   STATUS    RESTARTS   AGE
   argocd-application-controller-0                     1/1     Running   0          25m
   argocd-applicationset-controller-86bcdc46cf-qjcbj   1/1     Running   0          25m
   argocd-dex-server-7f65987db5-9prf9                  1/1     Running   0          25m
   argocd-notifications-controller-6885f68ddd-6s96m    1/1     Running   0          25m
   argocd-redis-7d5d5cb5b6-hwqk7                       1/1     Running   0          25m
   argocd-repo-server-7c74dd748c-5d7ng                 1/1     Running   0          25m
   argocd-server-777cfb8fc4-ghtk5                      1/1     Running   0          25m
   ```

3. **Встановлення Argo CD CLI та авторизація:**
   - Встановлено бінарний файл CLI `argocd.exe` версії `v2.14.2` у `D:\tools\bin\`.
   - Зчитано початковий пароль адміністратора з секрету `argocd-initial-admin-secret`.
   - Змінено постійний пароль адміністратора:
     - Користувач: `admin`
     - Пароль: `UniSchoolAdmin2026!`
   - Секрет `argocd-initial-admin-secret` безпечно видалено.

4. **Доступ до Веб-інтерфейсу:**
   - Прокидання портів:
   ```bash
   kubectl port-forward svc/argocd-server -n argocd 8080:443
   ```
   - URL: `https://localhost:8080`

---

## 5. Патерн App of Apps та автоматична синхронізація (Пункт 4)

1. **Кореневий маніфест (`bootstrap/root-app.yaml`):**
   ```yaml
   apiVersion: argoproj.io/v1alpha1
   kind: Application
   metadata:
     name: root-app
     namespace: argocd
     finalizers:
       - resources-finalizer.argocd.argoproj.io
   spec:
     project: default
     source:
       repoURL: https://github.com/Mkslxy/devOps-labs.git
       targetRevision: main
       path: argocd-apps
     destination:
       server: https://kubernetes.default.svc
       namespace: argocd
     syncPolicy:
       automated:
         prune: true
         selfHeal: true
   ```

2. **Дочірній маніфест (`argocd-apps/unischool-app.yaml`):**
   ```yaml
   apiVersion: argoproj.io/v1alpha1
   kind: Application
   metadata:
     name: unischool
     namespace: argocd
     finalizers:
       - resources-finalizer.argocd.argoproj.io
   spec:
     project: default
     source:
       repoURL: https://github.com/Mkslxy/devOps-labs.git
       targetRevision: main
       path: charts/unischool
       helm:
         valueFiles:
           - values-minikube.yaml
     destination:
       server: https://kubernetes.default.svc
       namespace: unischool
     syncPolicy:
       automated:
         prune: true
         selfHeal: true
       syncOptions:
         - CreateNamespace=true
   ```

3. **Результат застосування:**
   - Вручну було виконано лише одну команду: `kubectl apply -f bootstrap/root-app.yaml`.
   - Всі інші ресурси (простір імен `unischool`, Postgres, Redis, PVC, Django API, сервіси) створено повністю автоматично через GitOps-пайплайн.

```bash
$ argocd app list
NAME              CLUSTER                         NAMESPACE  PROJECT  STATUS  HEALTH   SYNCPOLICY  CONDITIONS  REPO                                       PATH              TARGET
argocd/root-app   https://kubernetes.default.svc  argocd     default  Synced  Healthy  Auto-Prune  <none>      https://github.com/Mkslxy/devOps-labs.git  argocd-apps       main
argocd/unischool  https://kubernetes.default.svc  unischool  default  Synced  Healthy  Auto-Prune  <none>      https://github.com/Mkslxy/devOps-labs.git  charts/unischool  main
```

---

## 6. Демонстрація оновлення застосунку через Git (Пункт 5)

1. **Зміна версії в Git:**
   - У файлі `charts/unischool/values-minikube.yaml` оновлено тег образу з `1.0.0` на `2.0.0`:
   ```yaml
   api:
     replicaCount: 1
     image:
       repository: ghcr.io/mkslxy/devops-labs/api
       tag: "2.0.0"
   ```

2. **Коміт та пуш:**
   ```bash
   git add charts/unischool/values-minikube.yaml
   git commit -m "feat: release v2.0.0 with updated API version tag"
   git push origin main
   ```

3. **Автоматична реакція Argo CD:**
   - Argo CD зафіксував комміт `666f9c1` у гілці `main`.
   - Виконано rolling-update деплойменту `unischool-api`:
   ```bash
   $ kubectl rollout status deployment unischool-api -n unischool
   Waiting for deployment "unischool-api" rollout to finish: 1 old replicas are pending termination...
   deployment "unischool-api" successfully rolled out
   ```

4. **Перевірка оновлених ендпоінтів:**
   ```bash
   $ curl http://127.0.0.1:8080/health/
   {"status":"OK","version":"2.0.0","timestamp":"2026-10-22T09:09:47.601690"}

   $ curl http://127.0.0.1:8080/version/
   {"version":"2.0.0","service":"unischool-api","timestamp":"2026-10-22T09:09:48.213590"}
   ```
   Застосунок успішно оновився наживо без жодного ручного втручання в кластер.

---

## 7. Дрейф конфігурації, Self-Healing, Degraded Health та Відкат (Пункт 6)

### 7.1. Дрейф без `selfHeal` та повернення з `selfHeal: true` (6.a)

1. **Вимкнення `selfHeal` у Git:**
   - У `argocd-apps/unischool-app.yaml` встановлено `selfHeal: false`, закомічено й запушено.
2. **Внесення ручного дрейфу через `kubectl`:**
   ```bash
   kubectl scale deployment unischool-api -n unischool --replicas=3
   ```
3. **Фіксація стану `OutOfSync` в Argo CD:**
   ```bash
   $ argocd app get unischool
   Sync Status:    OutOfSync from main (ba92767)
   Health Status:  Progressing

   GROUP  KIND        NAMESPACE  NAME           STATUS     HEALTH
   apps   Deployment  unischool  unischool-api  OutOfSync  Progressing
   ```
   *Пояснення:* Оскільки `selfHeal` вимкнено, Argo CD зафіксував розбіжність між кластером (3 репліки) і Git (1 репліка), але не змінював стан кластера примусово.

4. **Увімкнення `selfHeal: true` у Git:**
   - Змінено значення назад на `selfHeal: true`, закомічено й запушено.
   - Argo CD самостійно відновив стан кластера:
   ```bash
   $ kubectl get deployment unischool-api -n unischool
   NAME            READY   UP-TO-DATE   AVAILABLE   AGE
   unischool-api   1/1     1            1           16m
   ```
   Кластер автоматично повернувся до стану `Synced / Healthy`.

---

### 7.2. Демонстрація неіснуючого тегу образу: `Synced` + `Degraded` (6.b)

1. **Внесення помилкового тегу в Git:**
   - У `charts/unischool/values-minikube.yaml` встановлено:
   ```yaml
   api:
     image:
       tag: "non-existent-tag-999"
   ```
   - Закомічено: `git commit -m "test: use invalid image tag to demonstrate Degraded state"`.
   - Запушено в `main` (комміт `dbdb513`).

2. **Поведінка кластера та Argo CD:**
   - Маніфести у кластері відповідають Git, тому статус синхронізації — `Synced`:
   ```
   Sync Status: Synced to main (dbdb513)
   ```
   - Проте под перейшов у стан `Init:ErrImagePull` / `ImagePullBackOff`, через що ReplicaSet не може завершити оновлення:
   ```bash
   $ kubectl get pods -n unischool
   NAME                               READY   STATUS              RESTARTS   AGE
   unischool-api-5dd5544ff5-s64hl     0/1     Init:ErrImagePull   0          37s
   unischool-api-6c5c8fc68b-px6qs     1/1     Running             0          2m22s
   ```
   - Argo CD коректно діагностує стан застосунку як `Degraded` / `Progressing` (нездоровий стан).
   - Завдяки RollingUpdate старий робочий под (`v2.0.0`) продовжує обслуговувати трафік без падіння сервісу.

---

### 7.3. Відкат через `git revert` (6.c)

У філософії GitOps кластер ніколи не змінюється ручними командами типу `helm rollback` чи `kubectl rollout undo`. Всі відкати здійснюються через історію Git!

1. **Виконання відкату в Git:**
   ```bash
   git revert HEAD --no-edit
   git push origin main
   ```

2. **Історія комітів у Git:**
   ```bash
   $ git log -n 5 --oneline
   f8c0205 Revert "test: use invalid image tag to demonstrate Degraded state"
   dbdb513 test: use invalid image tag to demonstrate Degraded state
   666f9c1 feat: release v2.0.0 with updated API version tag
   297c4cf feat(gitops): re-enable selfHeal on unischool application
   ba92767 chore(gitops): disable selfHeal for drift testing, add concrete image tags
   ```

3. **Реакція Argo CD на відкат:**
   - Argo CD побачив комміт `f8c0205`, видалив зламаний под `Init:ErrImagePull` та підтвердив повне здоров'я релізу:
   ```bash
   $ kubectl get pods -n unischool
   NAME                               READY   STATUS    RESTARTS   AGE
   unischool-api-6c5c8fc68b-px6qs     1/1     Running   0          3m29s
   unischool-db-6f67fd6-d6xbc         1/1     Running   1          20m
   unischool-redis-657754f599-mnwtt   1/1     Running   1          20m
   ```

4. **Історія розгортань у Argo CD (`argocd app history`):**
   ```bash
   $ argocd app history unischool
   SOURCE  https://github.com/Mkslxy/devOps-labs.git
   ID      DATE                            REVISION
   0       2026-10-22 11:51:05 +0300 EEST  main (ad2151e)
   1       2026-10-22 12:04:49 +0300 EEST  main (ba92767)
   2       2026-10-22 12:08:29 +0300 EEST  main (666f9c1)
   3       2026-10-22 12:10:14 +0300 EEST  main (dbdb513)
   4       2026-10-22 12:11:51 +0300 EEST  main (f8c0205)
   ```

---

## 8. Чек-лист для живої демонстрації викладачу на захисті (Пункт 7)

Під час захисту лабораторної роботи демонструється:
1. **Веб-інтерфейс Argo CD:**
   - Відкрити браузер: `kubectl port-forward svc/argocd-server -n argocd 8080:443` -> `https://localhost:8080`.
   - Показати дерево ресурсів для `root-app` та `unischool` у стані `Synced / Healthy`.
2. **Оновлення через Git-коміт:**
   - Змінити параметр у `charts/unischool/values-minikube.yaml` (наприклад, змінити тег або репліки).
   - Зробити `git commit` + `git push`.
   - Показати в UI Argo CD автоматичне підхоплення комміту та плавний rollout.
3. **Демонстрація дрейфу (Drift) та Self-Heal:**
   - Виконати в терміналі: `kubectl scale deployment unischool-api -n unischool --replicas=3`.
   - Показати, як Argo CD за кілька секунд автоматично виправляє стан назад на 1 репліку.
4. **Демонстрація помилкового образу (Degraded):**
   - Вказати неіснуючий тег образу в Git.
   - Показати статус: `Synced` (конфіг співпадає), але `Degraded / Progressing` (контейнер не зміг запуститись).
5. **Відкат:**
   - Виконати `git revert HEAD --no-edit && git push`.
   - Показати відновлення застосунку до здорового стану та вивести історію `argocd app history unischool`.

---

## 9. Висновки

1. Проєкт успішно переведено з ручного імперативного керування через Helm на декларативну модель **GitOps**.
2. Впроваджено архітектурний шаблон **App of Apps**, що дозволяє керувати всіма сервісами кластера через єдиний кореневий маніфест.
3. Налаштовано публікацію версіонованих контейнерних образів у **GHCR** та реалізовано моніторинг версії застосунку через ендпоінти `/version` та `/health`.
4. Практично продемонстровано головні переваги GitOps:
   - Автоматичне виявлення та нівелювання несанкціонованого дрейфу конфігурації (**Self-Healing**).
   - Повний аудит змін через історію Git-комітів.
   - Миттєвий та надійний відкат збійних релізів через стандартний механізм `git revert`.
