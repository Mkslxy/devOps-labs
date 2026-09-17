from django.db.models import Q, QuerySet

from apps.gradebook.models import Grade, Attendance
from apps.gradebook.models.grade_column import GradeColumn


class GradeQueryPolicy:
    @staticmethod
    def for_user(user, qs: QuerySet | None = None):
        qs = qs or Grade.objects.all()

        if user.has_permission('gradebook.manage_all'):
            return qs

        q = Q()
        has_any_permission = False

        if user.has_permission('gradebook.read_teacher'):
            has_any_permission = True
            q |= (
                    Q(column__group__teacher=user) |
                    Q(column__lesson__teacher=user) |
                    Q(column__homework__created_by=user) |
                    Q(column__test_assignment__created_by=user)
            )

        if user.has_permission('gradebook.read'):
            has_any_permission = True
            q |= Q(student=user)

        if not has_any_permission:
            return qs.none()

        return qs.filter(q).distinct()


class AttendanceQueryPolicy:
    @staticmethod
    def for_user(user, qs: QuerySet | None = None):
        qs = qs or Attendance.objects.all()

        if user.has_permission('gradebook.manage_all'):
            return qs

        q = Q()
        has_any_permission = False

        if user.has_permission('gradebook.read_teacher'):
            has_any_permission = True
            q |= (
                    Q(column__group__teacher=user) |
                    Q(column__lesson__teacher=user) |
                    Q(column__homework__created_by=user) |
                    Q(column__test_assignment__created_by=user)
            )

        if user.has_permission('gradebook.read'):
            has_any_permission = True
            q |= Q(student=user)

        if not has_any_permission:
            return qs.none()

        return qs.filter(q).distinct()


class GradeColumnQueryPolicy:
    @staticmethod
    def for_user(user, qs: QuerySet | None = None):
        qs = qs or GradeColumn.objects.all()

        if user.has_permission('gradebook.manage_all'):
            return qs

        q = Q()
        has_any_permission = False

        if user.has_permission('gradebook.read_teacher'):
            has_any_permission = True
            q |= (
                    Q(group__teacher=user) |
                    Q(group__created_by=user) |
                    Q(lesson__teacher=user) |
                    Q(homework__created_by=user) |
                    Q(test_assignment__created_by=user)
            )

        if user.has_permission('gradebook.read'):
            has_any_permission = True
            q |= Q(group__user=user)

        if not has_any_permission:
            return qs.none()

        return qs.filter(q).distinct()
