from django.db import models

from apps.classes.models.group import Group


class GroupStudentStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    PAUSED = 'paused', 'Paused'
    EXPELLED = 'expelled', 'Expelled'
    COMPLETED = 'completed', 'Completed'


class GroupStudent(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        limit_choices_to={'role__slug__in': ['student', 'teacher', 'manager', 'methodist']},
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=GroupStudentStatus.choices, default=GroupStudentStatus.ACTIVE)

    class Meta:
        db_table = 'group_students'
        unique_together = ('group', 'student')
        indexes = [
            models.Index(
                fields=['status'],
                name='group_student_status_idx',
                condition=models.Q(status__in=[GroupStudentStatus.ACTIVE, GroupStudentStatus.PAUSED]),
            ),
        ]
