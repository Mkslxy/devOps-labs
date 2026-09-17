from django.db import models

from apps.core.models import TimeStampedModel
from apps.gradebook.models.grade import Grade
from apps.homework.models.homework import Homework


class HomeworkSubmission(TimeStampedModel):
    homework = models.ForeignKey(Homework, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey('users.User', on_delete=models.CASCADE)

    submission_text = models.TextField(null=True, blank=True)

    grade = models.OneToOneField(Grade, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'homework_submissions'
        indexes = [
            models.Index(fields=['homework', 'student'], name='hw_submission_lookup_idx'),
        ]

    @property
    def is_rated(self):
        return True if self.grade is not None else False
