import calendar

from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from apps.classes.models import GroupStudent, Group
from apps.classes.models.group_student import GroupStudentStatus
from apps.gradebook.models import GradeColumn


def is_student_in_column(student, column) -> bool:
    return GroupStudent.objects.filter(
        group=column.group,
        student=student,
        status=GroupStudentStatus.ACTIVE
    ).exists()


def get_first_day_of_month():
    now = timezone.now()
    return now.replace(day=1).date()


def get_last_day_of_month():
    now = timezone.now()
    _, last_day = calendar.monthrange(now.year, now.month)
    return now.replace(day=last_day).date()


def can_watch_gradebook(user, group_id, start_date, end_date):
    if user.has_permission('gradebook.manage_all'):
        return True

    permissions = [
        Group.objects.filter(id=group_id, teacher=user).exists(),
        Group.objects.filter(
            id=group_id,
            groupstudent__student=user,
            groupstudent__status='active'
        ).exists(),
        GradeColumn.objects.filter(
            group_id=group_id,
            date__range=(start_date, end_date)
        ).filter(
            Q(lesson__teacher=user) |
            Q(homework__created_by=user) |
            Q(test_assignment__created_by=user)
        ).exists(),
        user.has_permission('gradebook.read_manager') and
        Group.objects.filter(
            id=group_id,
            school__in=user.schools.all()
        ).exists(),
    ]

    if not any(permissions):
        return False
    return True
