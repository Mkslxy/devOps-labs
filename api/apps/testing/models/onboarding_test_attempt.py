from django.db import models

from apps.testing.models.helpers.test_attempt import TestAttemptProps
from apps.testing.models.test_attempt import TestAttemptStatus


class OnboardingTestAttempt(TestAttemptProps, models.Model):
    student = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100, null=True)
    email = models.EmailField(null=True)

    test_version = models.ForeignKey('testing.TestVersion', on_delete=models.RESTRICT)

    assignment = models.ForeignKey('testing.TestAssignment', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=TestAttemptStatus.choices, default=TestAttemptStatus.IN_PROGRESS)

    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    max_possible_score = models.FloatField(default=0.0)
    is_passed = models.BooleanField(default=False)

    score = models.FloatField(default=0.0)

    anonymous_token = models.UUIDField(
        unique=True,
        db_index=True
    )

    class Meta:
        db_table = 'onboarding_test_attempt'
        ordering = ['-started_at']
        unique_together = (('student', 'assignment'), ('email', 'assignment'))
        indexes = [
            models.Index(fields=['-started_at'], name='onboard_attempt_started_idx'),
            models.Index(
                fields=['status'],
                name='onboard_attempt_progress_idx',
                condition=models.Q(status=TestAttemptStatus.IN_PROGRESS),
            ),
        ]

    @property
    def actual_name(self):
        if self.student:
            return self.student.full_name
        return self.name

    @property
    def actual_email(self):
        if self.student:
            return self.student.email
        return self.email
