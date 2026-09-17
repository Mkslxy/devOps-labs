from django.db.models import Q, QuerySet, Prefetch

from apps.classes.models.group import GroupStatus
from apps.courses.models import TaskSubmission, Course, CourseModule, CourseTopic, Material, Task
from apps.finance.models import SubscriptionPlan
from apps.finance.models.student_subsctiption import SubscriptionStatus


class CourseQueryPolicy:
    @staticmethod
    def for_user(user, qs: QuerySet | None = None) -> QuerySet:
        qs = (qs or Course.objects
              .select_related('subject', 'created_by')
              .prefetch_related(Prefetch(
            'subscription_plans',
            queryset=SubscriptionPlan.objects.filter(is_active=True)))
              .all())

        if not user.is_authenticated:
            return qs.filter(is_active=True)

        if user.has_permission('courses.manage_all'):
            return qs

        return qs.filter(is_active=True)


class CourseModuleQueryPolicy:
    @staticmethod
    def for_user(user, qs: QuerySet | None = None) -> QuerySet:
        qs = (qs or CourseModule.objects
              .select_related('created_by', 'course')
              .all())

        if not user.is_authenticated:
            return qs.filter(course__is_active=True)

        if user.has_permission('courses.manage_all'):
            return qs

        return qs.filter(course__is_active=True)


class CourseTopicQueryPolicy:
    @staticmethod
    def for_user(user, qs: QuerySet | None = None) -> QuerySet:
        qs = (qs or CourseTopic.objects
              .select_related('created_by', 'module__course')
              .all())

        if not user.is_authenticated:
            return qs.filter(module__course__is_active=True)

        if user.has_permission('courses.manage_all'):
            return qs

        return qs.filter(module__course__is_active=True)


class SubmittableQueryPolicy:
    def __init__(self, model):
        self.model = model

    def for_user(self, user, qs: QuerySet | None = None) -> QuerySet:
        qs = (qs or self.model.objects
              .select_related('topic__module__course')
              .all())

        if not user.is_authenticated:
            return qs.none()

        if user.has_permission('courses.manage_all'):
            return qs

        return qs.filter(
            Q(
                topic__module__course__subscription_plans__sold_subscriptions__student=user,
                topic__module__course__subscription_plans__sold_subscriptions__status=SubscriptionStatus.ACTIVE,
            ) |
            Q(
                topic__module__course__groups__teacher=user,
                topic__module__course__groups__status=GroupStatus.ACTIVE
            ),
            topic__module__course__is_active=True
        ).distinct()


class MaterialQueryPolicy:
    @staticmethod
    def for_user(user, qs: QuerySet | None = None):
        return SubmittableQueryPolicy(model=Material).for_user(user, qs)


class TaskQueryPolicy:
    @staticmethod
    def for_user(user, qs: QuerySet | None = None):
        return SubmittableQueryPolicy(model=Task).for_user(user, qs)


class TaskSubmissionQueryPolicy:
    @staticmethod
    def for_user(user, qs: QuerySet | None = None) -> QuerySet:
        qs = qs or (TaskSubmission.objects
                    .select_related('task', 'student')
                    .prefetch_related('files')
                    .all())

        if user.has_permission('courses.manage_all'):
            return qs

        q = Q()

        if user.has_permission('courses.check'):
            q |= (
                    Q(task__topic__module__course__created_by=user) |
                    Q(student__groupstudent__group__teacher=user)
            )

            return qs.filter(q).distinct()

        return qs.none()
