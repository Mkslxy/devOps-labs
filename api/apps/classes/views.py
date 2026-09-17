from datetime import timedelta

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import SAFE_METHODS, AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.classes.filters import LessonFilter, SchoolFilter, TaskFilterSet, InternalMeetingFilterSet, GroupFilterSet
from apps.classes.models import Group, Lesson, LessonType, School, Task, InternalMeeting, MeetingType
from apps.classes.policies import TaskQueryPolicy
from apps.classes.serializers import GroupSerializer, LessonSerializer, RecurringLessonSerializer, \
    LessonPlanUpdateSerializer, LessonPlanReviewSerializer, LessonTypeSerializer, LessonStudentRateSerializer, \
    LessonStudentUnrateSerializer, StaffMeetingSerializer, TrainingSerializer, SchoolSerializer, TaskSerializer, \
    InternalMeetingSerializer
from apps.classes.services.lesson import create_lesson, update_lesson, cancel_participation_by_student, \
    cancel_lesson_by_teacher_service, create_recurring_lessons_service, update_lesson_plan_service, \
    review_lesson_plan_service
from apps.core.utils import HasPermission, CustomPageNumberPagination, IsOwnerOrHasCustomPermission
from apps.gradebook.serializers import GradeSerializer
from apps.gradebook.services import delete_lesson_grade, set_lesson_grade
from apps.users.models import User
from apps.users.serializers import SimpleUserSerializer


@extend_schema(tags=["Classes/Group"])
class GroupViewSet(ModelViewSet):
    queryset = Group.objects.all().select_related('teacher', 'course').prefetch_related('custom_user_set')
    serializer_class = GroupSerializer

    permission_classes = [HasPermission]
    required_permissions = ['groups.read', 'groups.write']

    pagination_class = CustomPageNumberPagination

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = GroupFilterSet
    search_fields = ['name', 'course__name']
    ordering_fields = ['name', 'created_at']
    ordering = ['-id']

    def get_required_permissions(self, request):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return ['groups.read', 'groups.write']
        return ['groups.read']

    def get_queryset(self):
        queryset = Group.objects.select_related('teacher', 'course', 'school') \
            .prefetch_related('custom_user_set') \
            .order_by('-id')

        user = self.request.user
        if user.role.slug in ['admin', 'operational_director', 'manager']:
            return queryset.all()
        if user.role.slug == 'methodist':
            return queryset.filter(school__in=user.schools.all())
        if user.role.slug == 'teacher':
            return queryset.filter(teacher=user)
        if user.role.slug == 'student':
            return queryset.filter(user=user)

        return queryset.none()


@extend_schema(tags=["Classes/Lesson"])
class LessonViewSet(ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [HasPermission]
    required_permissions = ['lessons.read']
    admin_permissions = ['lessons.manage_all']

    queryset = Lesson.objects.all()
    pagination_class = CustomPageNumberPagination

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = LessonFilter

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "cancel_lesson_by_teacher"]:
            return [HasPermission(), IsOwnerOrHasCustomPermission()]

        return [HasPermission()]

    def get_required_permissions(self, request):
        if self.action in ["create", "update", "partial_update", "destroy",
                           "cancel_lesson_by_teacher", "get_available_teachers"]:
            return ['lessons.write']
        return ['lessons.read']

    def get_queryset(self):
        queryset = (Lesson.objects
                    .select_related('group', 'teacher')
                    .prefetch_related('group__custom_user_set')
                    .order_by('-start_time'))

        user = self.request.user
        if user.role.slug in ['admin', 'operational_director', 'manager']:
            return queryset.all()
        if user.role.slug == 'methodist':
            return queryset.filter(group__school__in=user.schools.all())
        if user.role.slug == 'teacher':
            return queryset.filter(teacher=user)
        if user.role.slug == 'student':
            return queryset.filter(group__in=user.groups.all())

        return queryset.none()

    def paginate_queryset(self, queryset):
        is_calendar_request = (
                                  self.request.query_params.get('start') and
                                  self.request.query_params.get('end')
                              ) or self.request.query_params.get('calendar_view') == 'true'

        if is_calendar_request:
            return None

        return super().paginate_queryset(queryset)

    def perform_create(self, serializer):
        create_lesson(serializer)

    def perform_update(self, serializer):
        update_lesson(self.get_object(), serializer)

    @action(detail=False, methods=['post'], url_path='create-recurring', serializer_class=RecurringLessonSerializer)
    def create_recurring(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        created_lessons = create_recurring_lessons_service(
            serializer.validated_data,
            user=request.user
        )

        return Response({
            "status": "success",
            "count": len(created_lessons),
            "message": f"Created {len(created_lessons)} lessons."
        }, status=201)

    @action(detail=True, methods=['post'], url_path='cancel-participation')
    def cancel_participation(self, request, pk=None):
        try:
            is_fully_cancelled = cancel_participation_by_student(self.get_object(), request.user)
        except ValidationError as e:
            return Response({"message": str(e)}, status=400)

        message = "Lesson fully canceled." if is_fully_cancelled else "Participation cancelled."
        return Response({"message": message}, status=200)

    @action(detail=True, methods=['post'], url_path='cancel-lesson')
    def cancel_lesson_by_teacher(self, request, pk=None):
        lesson = self.get_object()

        reason = request.data.get('reason')
        if not reason:
            return Response({"error": "Reason is necessary."}, status=400)

        cancel_lesson_by_teacher_service(lesson, reason)
        return Response({"status": "Lesson cancelled by teacher"})

    @action(detail=True, methods=['patch'], url_path='update-plan', serializer_class=LessonPlanUpdateSerializer)
    def update_plan(self, request, pk=None):
        lesson = self.get_object()

        if request.user != lesson.teacher and not request.user.is_superuser:
            return Response({"error": "Only the assigned teacher can edit the plan."}, status=403)

        serializer = self.get_serializer(lesson, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        update_lesson_plan_service(lesson, serializer.validated_data)

        return Response({"status": lesson.plan_status, "message": "Plan updated"})

    @action(detail=True, methods=['post'], url_path='review-plan', serializer_class=LessonPlanReviewSerializer)
    def review_plan(self, request, pk=None):
        lesson = self.get_object()

        if not request.user.has_permission('lesson-plans.check'):
            return Response(
                {"error": "You do not have permission to check lesson plans."},
                status=403
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review_lesson_plan_service(lesson, request.user, serializer.validated_data)

        return Response({
            "status": lesson.plan_status,
            "feedback": lesson.plan_feedback
        })

    @action(detail=True, methods=['get'], url_path='available-teachers')
    def get_available_teachers(self, request, pk=None):
        lesson = self.get_object()
        start_time, end_time = lesson.start_time, lesson.end_time

        if not start_time or not end_time:
            return Response([])

        buffer = timedelta(minutes=10)
        new_start = start_time - buffer
        new_end = end_time + buffer
        school = lesson.group.school

        available_teachers = User.objects.filter(
            schools=school,
            role__slug='teacher',
        ).exclude(
            lesson__start_time__lt=new_end,
            lesson__end_time__gt=new_start,
        ).distinct()

        serializer = SimpleUserSerializer(available_teachers, many=True)
        return Response(serializer.data)


@extend_schema(tags=["Classes/LessonType"])
class LessonTypeViewSet(ModelViewSet):
    queryset = LessonType.objects.all().order_by("id")
    serializer_class = LessonTypeSerializer
    permission_classes = [HasPermission]

    def get_required_permissions(self, request):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return ["lessons.write"]

        return ["lessons.read"]


@extend_schema(tags=["Classes/Schools"])
class SchoolViewSet(ModelViewSet):
    queryset = School.objects.all().order_by("id")
    serializer_class = SchoolSerializer

    required_permissions = ['schools.manage_all']

    filter_backends = (DjangoFilterBackend, OrderingFilter)
    filterset_class = SchoolFilter

    def get_permissions(self):
        if self.request.method not in SAFE_METHODS:
            return [HasPermission()]
        return [AllowAny()]

    def get_required_permissions(self, request):
        return ['schools.manage_all']


@extend_schema(tags=["Classes/Task"])
class TaskViewSet(ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [HasPermission]
    required_permissions = ['tasks.read']
    admin_permissions = ['tasks.manage_all']

    queryset = Task.objects.all()

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TaskFilterSet

    def get_required_permissions(self, request):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return ['tasks.read', 'tasks.write']
        return ['tasks.read']

    def get_queryset(self):
        return TaskQueryPolicy.for_user(self.request.user)


class InternalMeetingViewSet(ModelViewSet):
    serializer_class = InternalMeetingSerializer
    permission_classes = [HasPermission]
    queryset = InternalMeeting.objects.all()

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = InternalMeetingFilterSet
    ordering = ['-start_time']

    def get_queryset(self):
        queryset = InternalMeeting.objects.select_related(
            'created_by'
        ).prefetch_related(
            'attendees'
        ).order_by('-start_time')

        user = self.request.user

        if user.role.slug in ['admin', 'manager', 'operational_director']:
            return queryset

        return queryset.filter(
            Q(created_by=user) | Q(attendees=user)
        ).distinct()


@extend_schema(tags=["Classes/StaffMeeting"])
class StaffMeetingViewSet(InternalMeetingViewSet):
    serializer_class = StaffMeetingSerializer

    def get_required_permissions(self, request):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return ['staff_meeting.write']
        return ['staff_meeting.read']

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.filter(type=MeetingType.STAFF_MEETING)


@extend_schema(tags=["Classes/Training"])
class TrainingViewSet(InternalMeetingViewSet):
    serializer_class = TrainingSerializer

    def get_required_permissions(self, request):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return ['trainings.write']
        return ['trainings.read']

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.filter(type=MeetingType.TRAINING)
