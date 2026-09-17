from django.db import models

from apps.core.models import AbstractFile


class GradeFile(AbstractFile):
    document = models.ForeignKey('gradebook.Grade', on_delete=models.CASCADE,
                                 related_name='files')

    class Meta:
        db_table = 'grade_files'
