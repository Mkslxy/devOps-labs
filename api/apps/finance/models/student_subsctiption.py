from django.db import models
from apps.core.models import TimeStampedModel
from datetime import date, timedelta


class SubscriptionStatus(models.TextChoices):
    PENDING_ASSIGNMENT = 'pending_assignment', 'Waiting for assignment'
    ACTIVE = 'active', 'Active'
    FROZEN = 'frozen', 'Frozen'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class StudentSubscription(TimeStampedModel):
    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='subscriptions'
    )
    plan = models.ForeignKey(
        'finance.SubscriptionPlan',
        on_delete=models.PROTECT,
        related_name='sold_subscriptions'
    )

    group = models.ForeignKey(
        'classes.Group',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='subscriptions'
    )

    status = models.CharField(
        choices=SubscriptionStatus.choices,
        max_length=30,
        default=SubscriptionStatus.PENDING_ASSIGNMENT
    )

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    lessons_remaining = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'student_subscription'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['-start_date'], name='sub_start_desc_idx'),
            models.Index(fields=['status'], name='sub_status_idx'),
            models.Index(fields=['student', 'status'], name='sub_student_status_idx'),
        ]

    @property
    def is_expired(self):
        grace_end_date = self.end_date + timedelta(days=self.plan.grace_period_days)
        return date.today() > grace_end_date

    @property
    def is_exhausted(self):
        if self.lessons_remaining is None:
            return False
        return self.lessons_remaining <= 0

    @property
    def is_valid(self):
        return self.status == SubscriptionStatus.ACTIVE and not self.is_expired and not self.is_exhausted
