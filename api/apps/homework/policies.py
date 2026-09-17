from django.db.models import Q, QuerySet

from apps.homework.models import HomeworkSubmission, Homework


class HomeworkQueryPolicy:

    @staticmethod
    def for_user(user, qs: QuerySet | None = None) -> QuerySet:
        qs = qs or Homework.objects.all()

        # Для головних шишок
        if user.has_permission('homework.manage_all'):
            return qs

        q = Q()
        has_any_permission = False

        # Для вчителів
        if user.has_permission('homework.read_teacher'):
            has_any_permission = True
            q |= (
                    Q(created_by=user) |
                    Q(lesson__teacher=user) |
                    Q(lesson__created_by=user) |
                    Q(group__teacher=user)
            )

        # Для менеджерів
        if user.has_permission('homework.read_manager'):
            has_any_permission = True
            q |= (
                    Q(lesson__group__school=user.schools.all()) |
                    Q(group__school=user.schools.all())
            )

        # Для студентів
        if user.has_permission('homework.read'):
            has_any_permission = True
            q |= (
                    Q(student=user) |
                    Q(group__user=user) |
                    Q(lesson__group__user=user)
            )

        if not has_any_permission:
            return qs.none()

        return qs.filter(q).distinct()


class HomeworkSubmissionReviewQueryPolicy:
    @staticmethod
    def for_user(user) -> QuerySet:
        qs = HomeworkSubmission.objects.all()

        if user.has_permission('homework.manage_all'):
            return qs

        return qs.filter(
            Q(homework__created_by=user) |
            Q(homework__lesson__teacher=user) |
            Q(homework__lesson__created_by=user) |
            Q(homework__group__teacher=user)
        ).distinct()
