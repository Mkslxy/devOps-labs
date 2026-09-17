from django.db import models

from apps.testing.models.test import Test


class TestStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    PUBLISHED = 'published', 'Published'
    ARCHIVED = 'archived', 'Archived'


class TestVersion(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='versions')

    version_number = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20,  choices=TestStatus.choices, default=TestStatus.DRAFT)

    time_limit_minutes = models.IntegerField(null=True)
    passing_score_percent = models.IntegerField(default=60)
    is_random_order = models.BooleanField(default=False)

    questions = models.ManyToManyField('testing.Question', related_name='test_versions')

    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'test_versions'
        unique_together = ('test', 'version_number')
        ordering = ['-version_number']
        indexes = [
            models.Index(fields=['status'], name='test_version_status_idx'),
        ]
