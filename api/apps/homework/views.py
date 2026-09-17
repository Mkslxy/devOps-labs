from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet, ModelViewSet
from rest_framework.permissions import SAFE_METHODS

from apps.core.services import sync_file_attachments
from apps.core.utils import HasPermission, CustomPageNumberPagination
from apps.gradebook.models import GradeFile
from apps.gradebook.services import update_grade, set_homework_grade, delete_homework_grade
from apps.homework.filters import HomeworkSubmissionFilterSet, HomeworkFilterSet
from apps.homework.policies import HomeworkQueryPolicy, HomeworkSubmissionReviewQueryPolicy
from apps.homework.models import Homework, HomeworkSubmission
from apps.homework.serializers import HomeworkSerializer, HomeworkSubmissionSerializer, HomeworkReviewSerializer, \
    HomeworkSubmissionRateSerializer


@extend_schema(tags=['Homework/Homework'])
class HomeworkViewSet(ModelViewSet):
    queryset = Homework.objects.all()
    serializer_class = HomeworkSerializer

    parser_classes = (MultiPartParser, FormParser)

    permission_classes = [HasPermission]
    pagination_class = CustomPageNumberPagination
    admin_permissions = ['homework.manage_all']

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = HomeworkFilterSet
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return HomeworkQueryPolicy.for_user(self.request.user)

    def get_required_permissions(self, request):
        if request.method not in SAFE_METHODS:
            return ['homework.write']
        return ['homework.read']


@extend_schema(
    tags=['Homework/HomeworkSubmission'],
    description="То для студентів онлі, щоб вони здавали свої дз."
)
class HomeworkSubmissionViewSet(ModelViewSet):
    queryset = HomeworkSubmission.objects.all()
    serializer_class = HomeworkSubmissionSerializer

    parser_classes = (MultiPartParser, FormParser)

    pagination_class = CustomPageNumberPagination
    permission_classes = [HasPermission]
    required_permissions = ['homework.read']

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = HomeworkSubmissionFilterSet
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return HomeworkSubmission.objects.filter(student=self.request.user)

    def perform_destroy(self, instance):
        if instance.homework.is_deadline_passed:
            raise ValidationError({"message": "Homework is already passed deadline"})

        if instance.is_rated:
            raise ValidationError({"message": "Homework is already rated"})

        super().perform_destroy(instance)


@extend_schema(tags=['Homework/HomeworkSubmissionReview'])
class HomeworkSubmissionReviewViewSet(ReadOnlyModelViewSet):
    queryset = HomeworkSubmission.objects.all()
    serializer_class = HomeworkReviewSerializer

    parser_classes = (MultiPartParser, FormParser)

    permission_classes = [HasPermission]
    admin_permissions = ['homework.manage_all']

    pagination_class = CustomPageNumberPagination

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = HomeworkSubmissionFilterSet
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return HomeworkSubmissionReviewQueryPolicy.for_user(self.request.user)

    def get_required_permissions(self, request):
        if request.method not in SAFE_METHODS:
            return ['homework.check', 'homework.read_teacher']
        return ['homework.read_teacher']

    @action(detail=True, methods=['post'], url_path='rate')
    def rate(self, request, pk=None):
        hw_sub = self.get_object()

        serializer = HomeworkSubmissionRateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        grade = hw_sub.grade
        value, comment = data.get('value'), data.get('comment')
        rated_by = request.user
        if not grade:
            hw_sub.grade = set_homework_grade(value, comment, rated_by, hw_sub)
        else:
            update_grade(value, comment, rated_by, grade)

        deleted_file_ids = data.pop('deleted_file_ids', [])
        uploaded_files = data.pop('uploaded_files', [])

        sync_file_attachments(
            document=hw_sub.grade,
            file_model=GradeFile,
            uploaded_files=uploaded_files,
            deleted_file_ids=deleted_file_ids
        )

        hw_sub.save()

        return Response(HomeworkReviewSerializer(instance=hw_sub).data)

    @action(detail=True, methods=['delete'], url_path='unrate')
    def unrate(self, request, pk=None):
        hw_sub = self.get_object()
        delete_homework_grade(hw_sub)
        return Response(status=status.HTTP_204_NO_CONTENT)
