from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.gradebook.models.grade_column import GradeColumn


class GradeCategory(models.TextChoices):
    CLASSWORK = 'classwork', 'Classwork'
    HOMEWORK = 'homework', 'Homework'
    TEST = 'test', 'Test'
    SPEAKING = 'speaking', 'Speaking'
    PROJECT = 'project', 'Project'
    TASK = 'task', 'Task'


class Grade(models.Model):
    column = models.ForeignKey(GradeColumn, on_delete=models.SET_NULL, null=True, blank=True, related_name='grades')
    category = models.CharField(max_length=20, choices=GradeCategory.choices)

    student = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='grades')

    # Звідки йде оцінка
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    document = GenericForeignKey('content_type', 'object_id')

    value = models.FloatField(default=0.0)
    comment = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'grades'
        indexes = [
            models.Index(fields=['content_type', 'object_id'], name='grade_content_obj_idx'),
        ]
