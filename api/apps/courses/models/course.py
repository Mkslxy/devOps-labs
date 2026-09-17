from django.db import models

from apps.core.models import TimeStampedModel
from apps.users.models import User


class Course(TimeStampedModel):
    title = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    level = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)

    subject = models.ForeignKey(
        'courses.Subject',
        on_delete=models.PROTECT,
        related_name='courses',
        null=True, blank=True
    )

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'courses'
        indexes = [
            models.Index(
                fields=['is_active'],
                name='course_active_idx',
                condition=models.Q(is_active=True),
            ),
            models.Index(fields=['level'], name='course_level_idx'),
        ]
