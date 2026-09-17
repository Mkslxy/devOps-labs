from django.db import models

from apps.core.google_colors import GoogleCalendarColor
from apps.core.models import TimeStampedModel


class MeetingType(models.TextChoices):
    TRAINING = 'training', 'Teacher Training'
    STAFF_MEETING = 'staff_meeting', 'Staff Meeting'
    ONE_ON_ONE = 'one_on_one', '1-to-1 Sync'


class InternalMeeting(TimeStampedModel):
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)

    type = models.CharField(max_length=20, choices=MeetingType.choices)

    attendees = models.ManyToManyField(
        'users.User',
        related_name='attended_meetings',
        blank=True
    )

    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    is_online = models.BooleanField(default=False)

    google_event_id = models.CharField(max_length=255, blank=True, null=True)
    meet_link = models.URLField(blank=True, null=True)
    html_link = models.URLField(blank=True, null=True)
    color_id = models.CharField(
        max_length=2,
        choices=GoogleCalendarColor.choices,
        default=GoogleCalendarColor.GRAPE,
        help_text="ID кольору в Google Calendar"
    )

    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_meetings'
    )

    class Meta:
        indexes = [
            models.Index(fields=['start_time'], name='meeting_start_time_idx'),
        ]
