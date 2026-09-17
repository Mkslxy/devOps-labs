from django.db import transaction
from django.db.models import Q
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import SAFE_METHODS
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.classes.models import Group
from apps.core.utils import HasPermission, CustomPageNumberPagination
from apps.gradebook.filters import GradeFilterSet, AttendanceFilterSet, GradeColumnFilterSet
from apps.gradebook.models import Grade, Attendance
from apps.gradebook.models.grade_column import GradeColumn
from apps.gradebook.policies import GradeQueryPolicy, AttendanceQueryPolicy, GradeColumnQueryPolicy
from apps.gradebook.serializers import GradeColumnSerializer, AttendanceSerializer, GradeViewSerializer, \
    AttendanceBatchSerializer, GradeColumnBatchSerializer, GradebookFilterSerializer, GradeColumnRetrieveSerializer
from apps.gradebook.services import get_aggregated_gradebook
from apps.gradebook.utils import can_watch_gradebook


@extend_schema(tags=["Gradebook/Journal"])
class GradebookGridView(APIView):
    permission_classes = [HasPermission]
    required_permissions = ['gradebook.read']

    @extend_schema(
        summary="Get gradebook grid",
        parameters=[GradebookFilterSerializer]
    )
    def get(self, request):
        serializer = GradebookFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        params = serializer.validated_data

        group_id = params['group_id']
        user = request.user

        if not can_watch_gradebook(user, group_id, params['start_date'], params['end_date']):
            raise PermissionDenied("You do not have access to this group.")

        data = get_aggregated_gradebook(
            group_id=group_id,
            start_date=params['start_date'],
            end_date=params['end_date'],
            request_user=user
        )

        return Response(data)


@extend_schema(tags=["Gradebook/Grade"])
class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeViewSerializer

    parser_classes = (MultiPartParser, FormParser)

    permission_classes = [HasPermission]
    pagination_class = CustomPageNumberPagination
    admin_permissions = ['gradebook.manage_all']

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = GradeFilterSet
    ordering_fields = [
        'created_at',
        'value',
        'student__last_name',
        'student__first_name',
        'column__date',
    ]

    def get_queryset(self):
        return GradeQueryPolicy.for_user(self.request.user)

    def get_required_permissions(self, request):
        if request.method not in SAFE_METHODS:
            return ['gradebook.write']
        return ['gradebook.read']


@extend_schema(tags=["Gradebook/Attendance"])
class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    permission_classes = [HasPermission]
    pagination_class = CustomPageNumberPagination
    admin_permissions = ['gradebook.manage_all']

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = AttendanceFilterSet
    ordering_fields = [
        'created_at',
        'category',
        'late_minutes',
        'student__last_name'
        'column__date'
    ]

    def get_queryset(self):
        return AttendanceQueryPolicy.for_user(self.request.user)

    def get_required_permissions(self, request):
        if request.method not in SAFE_METHODS:
            return ['gradebook.write']
        return ['gradebook.read']

    @extend_schema(
        description="Creates records for a list of students. If a record already exists, it updates the status.",
        request=AttendanceBatchSerializer
    )
    @action(detail=False, methods=['post'], url_path='batch', serializer_class=AttendanceBatchSerializer)
    def batch_create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        column = data['column']
        category = data['category']
        students = data['students']

        with transaction.atomic():
            Attendance.objects.filter(
                column=column,
                student__in=students
            ).delete()

            new_records = [
                Attendance(column=column, student=student, category=category)
                for student in students
            ]
            Attendance.objects.bulk_create(new_records)

        return Response({
            "message": f"Successfully processed {len(new_records)} records.",
            "column": column.id,
            "category": category
        })


@extend_schema(tags=["Gradebook/Column"])
class GradeColumnViewSet(viewsets.ModelViewSet):
    queryset = GradeColumn.objects.all()
    serializer_class = GradeColumnSerializer

    permission_classes = [HasPermission]
    pagination_class = CustomPageNumberPagination
    admin_permissions = ['gradebook.manage_all']

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = GradeColumnFilterSet
    ordering_fields = [
        'id',
        'title',
        'date'
    ]

    def get_queryset(self):
        return GradeColumnQueryPolicy.for_user(self.request.user)

    def get_required_permissions(self, request):
        if request.method not in SAFE_METHODS:
            return ['gradebook.write']
        return ['gradebook.read']

    def get_serializer_class(self):
        if self.action in ('retrieve',):
            return GradeColumnRetrieveSerializer
        return GradeColumnSerializer

    @extend_schema(
        description="Creates records for a list of dates.",
        request=GradeColumnBatchSerializer
    )
    @action(detail=False, methods=['post'], url_path='batch', serializer_class=GradeColumnBatchSerializer)
    def batch_create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        group = data['group']
        dates = data['dates']
        title = data['title']

        with transaction.atomic():
            new_records = [
                GradeColumn(
                    group=group,
                    title=title,
                    date=date
                )
                for date in dates
            ]
            GradeColumn.objects.bulk_create(new_records)

        return Response({
            "message": f"Successfully processed {len(new_records)} columns.",
            "group": group.id
        })
