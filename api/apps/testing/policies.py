from django.db.models import QuerySet, Q
from django.utils import timezone
from rest_framework import permissions

from apps.testing.models import Test, TestVersion, TestAttempt, StudentAnswer
from apps.testing.models.test_assigment import TestAssignment
from apps.users.models import User


class TestQueryPolicy:
    @staticmethod
    def for_user(user: User, qs: QuerySet | None = None):
        qs = qs or Test.objects.all()

        if user.has_permission('tests.manage_all'):
            return qs

        if user.has_permission('tests.read_teacher'):
            return qs.filter(created_by=user)

        return qs.none()


class TestVersionQueryPolicy:
    @staticmethod
    def for_user(user: User, qs: QuerySet | None = None):
        qs = qs or TestVersion.objects.all()

        if user.has_permission('tests.manage_all'):
            return qs

        if user.has_permission('tests.read_teacher'):
            return qs.filter(created_by=user)

        return qs.none()


class TestAssignmentQueryPolicy:
    @staticmethod
    def for_user(user: User, qs: QuerySet | None = None):
        qs = qs or TestAssignment.objects.all()

        if user.has_permission('tests.manage_all'):
            return qs

        q = Q()
        has_any_permission = False

        if user.has_permission('tests.read_teacher'):
            has_any_permission = True
            q |= (
                    Q(created_by=user) |
                    Q(test__created_by=user) |
                    Q(pinned_version__created_by=user) |
                    Q(test__current_version__created_by=user) |
                    Q(group__teacher=user) |
                    Q(lesson__group__teacher=user) |
                    Q(lesson__created_by=user) |
                    Q(material__created_by=user)
            )

        if user.has_permission('tests.read'):
            has_any_permission = True
            q |= (
                    (Q(lesson__group__user=user) | Q(group__user=user)) &
                    Q(starting_at__lte=timezone.now(), closing_at__gte=timezone.now())
            )

        if not has_any_permission:
            return qs.none()

        return qs.filter(q).distinct().select_related(
            'test',
            'test__current_version',
            'pinned_version',
            'lesson',
            'lesson__group',
            'group',
            'material'
        ).order_by('-created_at')


class TestAttemptQueryPolicy:
    @staticmethod
    def for_user(user: User, qs: QuerySet | None = None):
        qs = qs or TestAttempt.objects.all()

        qs = qs.select_related(
            'test_version',
            'test_version__test',
            'assignment'
        ).prefetch_related(
            'test_version__questions',
            'test_version__questions__options'
        ).order_by('-started_at')

        if user.has_permission('tests.manage_all'):
            return qs

        q = Q()
        has_any_permission = False

        if user.has_permission('tests.read_teacher'):
            has_any_permission = True
            q |= (
                    Q(assignment__created_by=user) |
                    Q(assignment__test__created_by=user) |
                    Q(assignment__pinned_version__created_by=user) |
                    Q(assignment__test__current_version__created_by=user) |
                    Q(assignment__group__teacher=user) |
                    Q(assignment__lesson__group__teacher=user) |
                    Q(assignment__lesson__created_by=user) |
                    Q(assignment__material__created_by=user)
            )

        if user.has_permission('tests.read'):
            has_any_permission = True
            q |= (
                Q(student=user)
            )

        if not has_any_permission:
            return qs.none()

        return qs.filter(q).distinct()


class StudentAnswerQueryPolicy:
    @staticmethod
    def for_user(user: User, qs: QuerySet | None = None):
        qs = qs or StudentAnswer.objects.all()

        qs = qs.select_related(
            'attempt__student',
            'attempt__assignment__test__current_version',
            'attempt__assignment__pinned_version',
            'attempt__assignment__material',
            'attempt__assignment__lesson__group__teacher',
            'question'
        )

        if user.has_permission('tests.manage_all'):
            return qs

        q = Q()
        has_any_permission = False

        if user.has_permission('tests.read_teacher'):
            has_any_permission = True
            q |= (
                    Q(attempt__assignment__created_by=user) |
                    Q(attempt__assignment__test__created_by=user) |
                    Q(attempt__assignment__pinned_version__created_by=user) |
                    Q(attempt__assignment__test__current_version__created_by=user) |
                    Q(attempt__assignment__group__teacher=user) |
                    Q(attempt__assignment__lesson__group__teacher=user) |
                    Q(attempt__assignment__lesson__created_by=user) |
                    Q(attempt__assignment__material__created_by=user)
            )

        if user.has_permission('tests.read'):
            has_any_permission = True
            q |= (
                Q(attempt__student=user)
            )

        if not has_any_permission:
            return qs.none()

        return qs.filter(q)


class CanViewAssignmentInfo(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        is_public = not any([obj.group, obj.lesson, obj.material, obj.group])
        if is_public:
            return True

        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.has_permission('tests.manage_all'):
            return True

        now = timezone.now()

        if user.has_permission('tests.read_teacher'):
            is_creator = (
                    obj.created_by_id == user.id or
                    obj.test.created_by_id == user.id or
                    (obj.pinned_version and obj.pinned_version.created_by_id == user.id) or
                    (obj.test.current_version and obj.test.current_version.created_by_id == user.id) or
                    (obj.lesson and obj.lesson.created_by_id == user.id) or
                    (obj.material and obj.material.created_by_id == user.id)
            )
            if is_creator:
                return True

            is_teacher = False
            if obj.group and obj.group.teacher_id == user.id:
                is_teacher = True
            elif obj.lesson and obj.lesson.group and obj.lesson.group.teacher_id == user.id:
                is_teacher = True

            if is_teacher:
                return True

        if user.has_permission('tests.read'):
            if obj.closing_at and obj.closing_at < now:
                return False

            if obj.group and obj.group.groupstudent_set.filter(
                    student=user,
                    status='active'
            ).exists():
                return True

            if obj.lesson and obj.lesson.group and obj.lesson.group.groupstudent_set.filter(
                    student=user,
                    status='active'
            ).exists():
                return True

        return False
