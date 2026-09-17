from django.db import models


class Permission(models.Model):
    slug = models.CharField(max_length=255, unique=True)
    description = models.TextField()

    class Meta:
        db_table = 'permissions'
