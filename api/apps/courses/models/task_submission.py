from django.db import models

from apps.core.models import TimeStampedModel


class TaskSubmission(TimeStampedModel):
    task = models.ForeignKey('courses.Task', on_delete=models.CASCADE)
    student = models.ForeignKey('users.User', on_delete=models.CASCADE)

    submission_text = models.TextField(null=True, blank=True)

    grade = models.OneToOneField('gradebook.Grade', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'task_submissions'

    @property
    def is_rated(self):
        return True if self.grade is not None else False