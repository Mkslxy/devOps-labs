from django.db import models

from apps.classes.models import Lesson


class VisitStatus(models.TextChoices):
    PLANNED = 'planned', 'Planned'
    CANCELLED = 'cancelled', 'Cancelled'


class LessonStudent(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='students')
    student = models.ForeignKey('users.User', on_delete=models.CASCADE)

    status = models.CharField(
        max_length=20,
        choices=VisitStatus.choices,
        default=VisitStatus.PLANNED
    )

    class Meta:
        unique_together = ('lesson', 'student')
