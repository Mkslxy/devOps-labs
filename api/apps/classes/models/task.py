from django.db import models

from apps.core.models import TimeStampedModel


class TaskStatus(models.TextChoices):
    TODO = 'todo', 'To Do'
    IN_PROGRESS = 'in_progress', 'In progress'
    DONE = 'done', 'Done'
    CANCELLED = 'cancelled', 'Cancelled'


class Task(TimeStampedModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    assignee = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='tasks')

    status = models.CharField(
        max_length=15,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO,
    )

    deadline = models.DateTimeField(null=True, blank=True)

    google_task_id = models.CharField(max_length=255, null=True, blank=True)
    google_tasklist_id = models.CharField(max_length=255, default='@default')

    created_by = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='created_tasks')

    class Meta:
        db_table = 'task'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at'], name='task_created_desc_idx'),
            models.Index(fields=['assignee', 'status'], name='task_assignee_status_idx'),
            models.Index(fields=['deadline'], name='task_deadline_idx'),
        ]

    @property
    def google_status(self):
        if self.status in [TaskStatus.DONE, TaskStatus.CANCELLED]:
            return 'completed'
        return 'needsAction'
