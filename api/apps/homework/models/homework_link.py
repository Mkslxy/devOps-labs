from django.db import models

from apps.core.models import AbstractLink


class HomeworkLink(AbstractLink):
    document = models.ForeignKey('homework.Homework', on_delete=models.CASCADE, related_name='links')

    class Meta:
        db_table = 'homework_links'
