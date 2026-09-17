from django.db import models

from apps.core.models import AbstractFile


class HomeworkSubmissionFile(AbstractFile):
    document = models.ForeignKey('homework.HomeworkSubmission', on_delete=models.CASCADE, related_name='files')

    class Meta:
        db_table = 'homework_submission_files'
