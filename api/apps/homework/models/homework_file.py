from django.db import models

from apps.core.models import AbstractFile


class HomeworkFile(AbstractFile):
    document = models.ForeignKey('homework.Homework', on_delete=models.CASCADE, related_name='files')

    class Meta:
        db_table = 'homework_files'
