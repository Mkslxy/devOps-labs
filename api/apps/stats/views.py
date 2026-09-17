from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet

from apps.classes.models import Group
from apps.classes.models.group_student import GroupStudent
from apps.core.utils import HasPermission
from apps.stats.serializers import StudentPerformanceSerializer, GroupPerformanceSerializer
from apps.stats.services import get_student_performance, get_group_performance, get_student_performance_in_group
from apps.users.models import User


@extend_schema(tags=['Stats/StudentStats'])
class StudentPerformanceViewSet(GenericViewSet):
    serializer_class = StudentPerformanceSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    admin_permissions = ['stats.manage_all']

    def get_required_permissions(self, request):
        if self.action == 'student':
            return ['stats.read_teacher']
        if self.action == 'student-group':
            return ['stats.read_teacher']
        return []

    @extend_schema(summary="Stats for current User")
    @action(detail=False, methods=['get'])
    def me(self, request):
        student = request.user
        data = get_student_performance(student)
        serializer = self.get_serializer(data)
        return Response(serializer.data)

    @extend_schema(summary="Stats for current User in group")
    @action(detail=False, methods=['get'], url_path='me-group')
    def me_group(self, request):
        group_id = request.query_params.get('group_id')
        if not group_id:
            return Response({"group_id": "group_id is required"}, status=400)

        student = request.user

        group_s_qs = GroupStudent.objects.filter(group_id=group_id, student=student)
        if not group_s_qs.exists():
            return Response({"detail": "Student not in the group."}, status=404)

        group = GroupStudent.objects.filter(group_id=group_id, student=student).first().group

        data = get_student_performance_in_group(student, group)
        serializer = self.get_serializer(data, many=False)
        return Response(serializer.data)

    @extend_schema(summary="Stats for specific student.")
    @action(detail=False, methods=['get'])
    def student(self, request):
        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response({"student_id": "required field"}, status=400)

        user_qs = User.objects.filter(id=student_id)
        if not user_qs.exists():
            return Response({"detail": "Студент не знайдений"}, status=404)

        student = user_qs.first()
        data = get_student_performance(student)
        serializer = self.get_serializer(data)
        return Response(serializer.data)

    @extend_schema(summary="Stats for student in group.")
    @action(detail=False, methods=['get'], url_path='student-group')
    def student_group(self, request):
        student_id = request.query_params.get('student_id')
        group_id = request.query_params.get('group_id')

        if not student_id or not group_id:
            return Response({"detail": "student_id and group_id is required"}, status=400)

        user_qs = User.objects.filter(id=student_id)
        if not user_qs.exists():
            return Response({"detail": "Студент не знайдений"}, status=404)

        student = user_qs.first()

        group_s_qs = GroupStudent.objects.filter(group_id=group_id, student=student)
        if not group_s_qs.exists():
            return Response({"detail": "Student not in the group."}, status=404)

        group = GroupStudent.objects.filter(group_id=group_id, student=student).first().group

        data = get_student_performance_in_group(student, group)
        serializer = self.get_serializer(data, many=False)
        return Response(serializer.data)


@extend_schema(tags=["Stats/GroupStats"])
class GroupPerformanceView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    admin_permissions = ['stats.manage_all']
    required_permissions = ['stats.read_teacher']

    @extend_schema(summary="Статистика групи")
    def get(self, request, group_id):
        group_qs = Group.objects.filter(id=group_id)
        if not group_qs.exists():
            return Response({"detail": "Group is not found."}, status=404)

        group = group_qs.first()
        data = get_group_performance(group)

        serializer = GroupPerformanceSerializer(instance=data)
        return Response(serializer.data)
