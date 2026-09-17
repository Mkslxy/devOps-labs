from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, SAFE_METHODS
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response

from apps.core.services import sync_file_attachments
from apps.core.utils import HasPermission, CustomPageNumberPagination, IsOwnerOrHasCustomPermission
from apps.courses.filters import TaskFilterSet, TaskSubmissionFilterSet, CourseFilterSet, CourseModuleFilterSet, \
    CourseTopicFilterSet, MaterialFilterSet
from apps.courses.models import Course, CourseModule, CourseTopic, Material, Task, TaskSubmission, Subject
from apps.courses.policies import TaskSubmissionQueryPolicy, CourseQueryPolicy, CourseModuleQueryPolicy, \
    CourseTopicQueryPolicy, MaterialQueryPolicy
from apps.courses.serializers import CourseSerializer, CourseModuleSerializer, CourseTopicSerializer, \
    MaterialSerializer, SubjectSerializer, TaskSerializer, TaskSubmissionSerializer, TaskReviewSerializer, \
    TaskSubmissionRateSerializer
from apps.gradebook.models import GradeFile
from apps.gradebook.services import set_task_grade, update_grade, delete_task_grade


class CoursesPermissionsMixin:
    permission_classes = [HasPermission]
    required_permissions = ["courses.write"]
    admin_permissions = ["courses.manage_all"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        if self.action in ["update", "partial_update", "destroy"]:
            return [HasPermission(), IsOwnerOrHasCustomPermission()]

        return super().get_permissions()


@extend_schema(tags=["Courses/Subject"])
class SubjectViewSet(CoursesPermissionsMixin, viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer

    filter_backends = [OrderingFilter]
    ordering = ['name']


@extend_schema(tags=["Courses/Course"])
class CourseViewSet(CoursesPermissionsMixin, viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = CourseFilterSet
    ordering = ['-created_at']
    ordering_fields = ['title', 'price', 'created_at', 'level']

    def get_queryset(self):
        return CourseQueryPolicy.for_user(self.request.user)


@extend_schema(tags=["Courses/Module"])
class CourseModuleViewSet(CoursesPermissionsMixin, viewsets.ModelViewSet):
    queryset = CourseModule.objects.all()
    serializer_class = CourseModuleSerializer

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = CourseModuleFilterSet
    ordering = ['course_id', 'sort_order', 'id']
    ordering_fields = ['title', 'sort_order']

    def get_queryset(self):
        return CourseModuleQueryPolicy.for_user(self.request.user)


@extend_schema(tags=["Courses/Topic"])
class CourseTopicViewSet(CoursesPermissionsMixin, viewsets.ModelViewSet):
    queryset = CourseTopic.objects.all()
    serializer_class = CourseTopicSerializer

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = CourseTopicFilterSet
    ordering = ['module_id', 'sort_order', 'id']
    ordering_fields = ['title', 'sort_order']

    def get_queryset(self):
        return CourseTopicQueryPolicy.for_user(self.request.user)


@extend_schema(tags=["Courses/Material"])
class MaterialViewSet(CoursesPermissionsMixin, viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

    parser_classes = (MultiPartParser, FormParser)

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = MaterialFilterSet
    ordering = ['created_at']
    ordering_fields = ['title', 'created_at', 'updated_at', 'access_level']

    def get_queryset(self):
        return MaterialQueryPolicy.for_user(self.request.user)


@extend_schema(tags=["Courses/Task"])
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    parser_classes = (MultiPartParser, FormParser)

    pagination_class = CustomPageNumberPagination
    permission_classes = [HasPermission]
    admin_permissions = ["courses.manage_all"]

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TaskFilterSet
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return MaterialQueryPolicy.for_user(
            user=self.request.user,
            qs=Task.objects.select_related(
                'topic',
                'created_by'
            ).prefetch_related(
                'files',
                'links'
            ).all()
        )

    def get_required_permissions(self, request):
        if request.method not in SAFE_METHODS:
            return ['courses.write']
        return []


@extend_schema(
    tags=['Courses/TaskSubmission'],
    description="То для студентів онлі, щоб вони здавали свої таски."
)
class TaskSubmissionViewSet(viewsets.ModelViewSet):
    queryset = TaskSubmission.objects.all()
    serializer_class = TaskSubmissionSerializer

    parser_classes = (MultiPartParser, FormParser)

    pagination_class = CustomPageNumberPagination
    permission_classes = [HasPermission]

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TaskSubmissionFilterSet
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return (TaskSubmission.objects
                .select_related('task', 'student')
                .prefetch_related('files')
                .filter(student=self.request.user))

    def perform_destroy(self, instance):
        if instance.task.is_deadline_passed:
            raise ValidationError({"message": "Task is already passed deadline"})

        if instance.is_rated:
            raise ValidationError({"message": "Task is already rated"})

        super().perform_destroy(instance)


@extend_schema(tags=['Courses/TaskSubmissionReview'])
class TaskSubmissionReviewViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TaskSubmission.objects.all()
    serializer_class = TaskReviewSerializer

    parser_classes = (MultiPartParser, FormParser)

    permission_classes = [HasPermission]
    admin_permissions = ['courses.manage_all']
    required_permissions = ['courses.check']

    pagination_class = CustomPageNumberPagination

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TaskSubmissionFilterSet
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return TaskSubmissionQueryPolicy.for_user(self.request.user)

    @action(detail=True, methods=['post'], url_path='rate')
    def rate(self, request, pk=None):
        task_sub = self.get_object()

        serializer = TaskSubmissionRateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        grade = task_sub.grade
        value, comment = data.get('value'), data.get('comment')
        rated_by = request.user
        if not grade:
            task_sub.grade = set_task_grade(value, comment, rated_by, task_sub)
        else:
            update_grade(value, comment, rated_by, grade)

        deleted_file_ids = data.pop('deleted_file_ids', [])
        uploaded_files = data.pop('uploaded_files', [])

        sync_file_attachments(
            document=task_sub.grade,
            file_model=GradeFile,
            uploaded_files=uploaded_files,
            deleted_file_ids=deleted_file_ids
        )

        task_sub.save()

        return Response(TaskReviewSerializer(instance=task_sub).data)

    @action(detail=True, methods=['delete'], url_path='unrate')
    def unrate(self, request, pk=None):
        hw_sub = self.get_object()
        delete_task_grade(hw_sub)
        return Response(status=204)
