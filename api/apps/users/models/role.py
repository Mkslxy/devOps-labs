from django.db import models


class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)

    permissions = models.ManyToManyField(
        'users.Permission',
        blank=True,
        related_name='roles'
    )

    def __str__(self):
        return self.name
