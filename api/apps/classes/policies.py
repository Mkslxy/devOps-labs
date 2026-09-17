from django.db.models import QuerySet, Q

from apps.classes.models import Task


class TaskQueryPolicy:

    @staticmethod
    def for_user(user, qs: QuerySet | None = None):
        qs = (qs or Task.objects.select_related('assignee').all())

        if user.has_permission('tasks.manage_all'):
            return qs

        q = Q()

        if user.has_permission('tasks.write'):
            q |= Q(created_by=user)

        if user.has_permission('tasks.read'):
            q |= (
                    Q(assignee=user) |
                    Q(created_by=user)
            )

        if q:
            return qs.filter(q)

        return qs.none()
