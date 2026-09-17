from django.db import models

from apps.core.models import AbstractFile


class TaskFile(AbstractFile):
    document = models.ForeignKey('courses.Task', on_delete=models.CASCADE, related_name='files')

    class Meta:
        db_table = 'task_files'
