from django.db import models

from apps.testing.models.helpers.test_attempt import TestAttemptProps
from apps.testing.models.test_assigment import TestAssignment
from apps.testing.models.test_version import TestVersion


class TestAttemptStatus(models.TextChoices):
    IN_PROGRESS = 'in_progress', 'In Progress'
    COMPLETED = 'completed', 'Completed'
    TIMED_OUT = 'timed_out', 'Timed Out'
    ABANDONED = 'abandoned', 'Abandoned'


class TestAttempt(TestAttemptProps, models.Model):
    student = models.ForeignKey('users.User', on_delete=models.CASCADE)
    test_version = models.ForeignKey(TestVersion, on_delete=models.RESTRICT)

    assignment = models.ForeignKey(TestAssignment, on_delete=models.CASCADE)

    status = models.CharField(max_length=20, choices=TestAttemptStatus.choices, default=TestAttemptStatus.IN_PROGRESS)

    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    max_possible_score = models.FloatField(default=0.0)
    grade = models.ForeignKey('gradebook.Grade', on_delete=models.SET_NULL, null=True, blank=True)

    is_passed = models.BooleanField(default=False)

    class Meta:
        db_table = 'test_attempts'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['-started_at'], name='test_attempt_started_idx'),
            models.Index(
                fields=['status'],
                name='test_attempt_progress_idx',
                condition=models.Q(status=TestAttemptStatus.IN_PROGRESS),
            ),
        ]

    @property
    def duration(self):
        if self.finished_at and self.started_at:
            return self.finished_at - self.started_at
        return None
