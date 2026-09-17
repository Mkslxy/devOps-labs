from django.db import models

from apps.users.models import User


class AccessLevel(models.TextChoices):
    PUBLIC = 'public', 'Public'
    STUDENTS = 'students', 'Students'
    TEACHERS = 'teachers', 'Teachers'
    GROUP_ONLY = 'group_only', 'Group Only'
    COURSE_ONLY = 'course_only', 'Course Only'
    ADMINS = 'admins', 'Admins'


class Material(models.Model):
    topic = models.ForeignKey('courses.CourseTopic', on_delete=models.CASCADE, null=True, blank=True)

    title = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)  # Загальний опис

    access_level = models.CharField(max_length=20, choices=AccessLevel.choices, default=AccessLevel.GROUP_ONLY)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'materials'
        indexes = [
            models.Index(fields=['access_level'], name='material_access_idx'),
        ]
