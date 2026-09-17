from django.db import models

from apps.core.models import TimeStampedModel


class SubscriptionPlan(TimeStampedModel):
    name = models.CharField(max_length=255, help_text="'The History of Germany', 'Aryans Today'")
    description = models.TextField(null=True, blank=True)

    lessons_count = models.PositiveIntegerField()
    duration_days = models.PositiveIntegerField()
    grace_period_days = models.PositiveIntegerField(
        default=0,
        help_text="Debt term in days(How many days student can attend lessons after end of sub term)"
    )

    price = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_lesson = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.ForeignKey(
        'finance.Currency',
        on_delete=models.PROTECT,
        related_name='subscription_plans'
    )

    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='subscription_plans'
    )
    lesson_type = models.ForeignKey(
        'classes.LessonType',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        help_text="'Stay after classes Lesson', 'Individual'"
    )

    is_active = models.BooleanField(default=True, help_text="Is available for users")

    class Meta:
        db_table = 'subscription_plan'
        indexes = [
            models.Index(
                fields=['is_active'],
                name='plan_active_idx',
                condition=models.Q(is_active=True),
            ),
        ]
