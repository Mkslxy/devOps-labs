from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class NotificationType(models.TextChoices):
    LESSON_REMINDER_3H = "lesson_reminder_3h", "Lesson Reminder (3 hours)"
    LESSON_REMINDER_EVENING = "lesson_reminder_evening", "Lesson Reminder (Evening)"
    WEEKLY_SCHEDULE = "weekly_schedule", "Weekly Schedule"


class NotificationLog(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    type = models.CharField(max_length=50, choices=NotificationType.choices)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("content_type", "object_id", "type")
        indexes = [
            models.Index(fields=["content_type", "object_id", "type"]),
        ]
