from datetime import timedelta

from django.utils import timezone


class TestAttemptProps:
    @property
    def questions_qs(self):
        qs = self.test_version.questions.all()
        if self.test_version.is_random_order:
            qs = qs.order_by('?')
        return qs

    @property
    def deadline(self):
        limit = self.assignment.custom_time_limit or self.test_version.time_limit_minutes
        if not limit:
            return None
        return self.started_at + timedelta(minutes=limit)

    @property
    def remaining_seconds(self):
        if not self.deadline:
            return None
        delta = self.deadline - timezone.now()
        return max(int(delta.total_seconds()), 0)