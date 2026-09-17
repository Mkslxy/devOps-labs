from django.db import models

from apps.courses.models.course import Course
from apps.users.models import User


class CourseModule(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.IntegerField(default=0)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'course_modules'
        indexes = [
            models.Index(fields=['course', 'sort_order'], name='module_course_order_idx'),
        ]
