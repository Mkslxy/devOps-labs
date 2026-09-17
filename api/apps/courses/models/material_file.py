from django.db import models

from apps.core.models import AbstractFile


class MaterialFile(AbstractFile):
    document = models.ForeignKey('courses.Material', on_delete=models.CASCADE, related_name='files')

    class Meta:
        db_table = 'material_files'
