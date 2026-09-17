from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel


class Task(TimeStampedModel):
    topic = models.ForeignKey('courses.CourseTopic', on_delete=models.CASCADE, null=True, blank=True)

    title = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    deadline = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'tasks'
        indexes = [
            models.Index(fields=['deadline'], name='course_task_deadline_idx'),
        ]

    @property
    def is_deadline_passed(self):
        deadline = self.deadline
        return self.deadline < timezone.now() if deadline else False
