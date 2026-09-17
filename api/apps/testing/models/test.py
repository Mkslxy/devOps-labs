from django.db import models


class Test(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    current_version = models.OneToOneField(
        'TestVersion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_for_test'
    )

    class Meta:
        db_table = 'tests'
