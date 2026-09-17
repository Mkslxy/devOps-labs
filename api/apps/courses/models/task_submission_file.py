from django.db import models

from apps.core.models import AbstractFile


class TaskSubmissionFile(AbstractFile):
    document = models.ForeignKey('courses.TaskSubmission', on_delete=models.CASCADE, related_name='files')

    class Meta:
        db_table = 'task_submission_files'
