from django.db import models

from apps.core.models import AbstractLink


class MaterialLink(AbstractLink):
    document = models.ForeignKey('courses.Material', on_delete=models.CASCADE, related_name='links')

    class Meta:
        db_table = 'material_links'
