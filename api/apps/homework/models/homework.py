from django.db import models
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.core.models import TimeStampedModel


class Homework(TimeStampedModel):
    lesson = models.ForeignKey('classes.Lesson', on_delete=models.CASCADE, null=True, blank=True,
                               related_name='homeworks')
    student = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True,
                                related_name='homeworks')
    group = models.ForeignKey('classes.Group', on_delete=models.CASCADE, null=True, blank=True,
                              related_name='homeworks')

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    deadline = models.DateTimeField()

    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='homework_creator'
    )

    grade_column = models.ForeignKey('gradebook.GradeColumn', on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='homework')

    class Meta:
        db_table = 'homeworks'
        indexes = [
            models.Index(fields=['deadline'], name='homework_deadline_idx'),
        ]

    def clean(self):
        connections_count = sum([
            bool(self.lesson),
            bool(self.student),
            bool(self.group),
        ])

        if connections_count > 1 or connections_count == 0:
            raise ValidationError(
                {"message": "Homework should be connected to only one entity at a time (Lesson OR Student OR Group)."}
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @property
    def is_deadline_passed(self):
        return self.deadline < timezone.now()

    def delete(self, using=None, keep_parents=False):
        if self.grade_column is not None:
            self.grade_column.delete_if_empty()
        super().delete(using, keep_parents)
