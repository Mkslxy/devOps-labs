from django.db import models

from apps.courses.models.course_module import CourseModule
from apps.users.models import User


class CourseTopic(models.Model):
    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, blank=True, null=True)
    content_description = models.TextField(blank=True, null=True)
    sort_order = models.IntegerField(default=0)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'course_topics'
        indexes = [
            models.Index(fields=['module', 'sort_order'], name='topic_module_order_idx'),
        ]
