from django.db import models

from apps.core.models import AbstractLink


class TaskLink(AbstractLink):
    document = models.ForeignKey('courses.Task', on_delete=models.CASCADE, related_name='links')

    class Meta:
        db_table = 'task_links'
