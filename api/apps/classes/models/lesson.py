from django.db import models

from apps.classes.models.group import Group
from apps.core.google_colors import GoogleCalendarColor
from apps.core.models import TimeStampedModel


class LessonStatus(models.TextChoices):
    SCHEDULED = 'scheduled', 'Scheduled'
    COMPLETED = 'completed', 'Completed'
    CANCELLED_BY_TEACHER = 'cancelled_by_teacher', 'Cancelled by Teacher'
    CANCELLED_BY_STUDENT = 'cancelled_by_student', 'Cancelled by Student'
    CANCELLED_BY_SYSTEM = 'cancelled_by_system', 'Cancelled by System'
    RESCHEDULED = 'rescheduled', 'Rescheduled'
    NO_SHOW_TEACHER = 'no_show_teacher', 'No Show (Teacher)'
    NO_SHOW_GROUP = 'no_show_group', 'No Show (Group)'


class PlanStatus(models.TextChoices):
    EMPTY = 'empty', 'Not Created'
    DRAFT = 'draft', 'Draft'
    ON_REVIEW = 'on_review', 'On Review'
    CHANGES_REQUESTED = 'changes_requested', 'Changes Requested'
    APPROVED = 'approved', 'Approved'


class Lesson(TimeStampedModel):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    teacher = models.ForeignKey('users.User', on_delete=models.RESTRICT)

    topic = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)

    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    lesson_type = models.ForeignKey(
        'classes.LessonType',
        on_delete=models.PROTECT,
        related_name='lessons',
    )

    actual_duration_minutes = models.IntegerField(null=True, blank=True)
    is_online = models.BooleanField(default=False)

    cancelled_reason = models.CharField(max_length=255, blank=True)
    rescheduled_from_lesson = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)

    google_event_id = models.CharField(max_length=255, blank=True, null=True)
    meet_link = models.URLField(blank=True, null=True)
    html_link = models.URLField(blank=True, null=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    lesson_plan = models.TextField(blank=True, default="")
    plan_status = models.CharField(
        max_length=20,
        choices=PlanStatus.choices,
        default=PlanStatus.EMPTY
    )
    plan_feedback = models.TextField(blank=True, null=True)
    plan_approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_lessons'
    )
    plan_approved_at = models.DateTimeField(null=True, blank=True)

    lesson_number_in_course = models.IntegerField(null=True, blank=True)
    color_id = models.CharField(
        max_length=2,
        choices=GoogleCalendarColor.choices,
        default=GoogleCalendarColor.GRAPE,
        help_text="ID кольору в Google Calendar"
    )

    grade_column = models.ForeignKey('gradebook.GradeColumn', on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='lesson')

    status = models.CharField(max_length=30, choices=LessonStatus.choices, default=LessonStatus.SCHEDULED)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='lessons_created'
    )


    class Meta:
        db_table = 'lessons'
        indexes = [
            models.Index(fields=['start_time'], name='lesson_start_time_idx'),
            models.Index(fields=['group', 'start_time'], name='lesson_group_start_idx'),
            models.Index(fields=['teacher', 'start_time'], name='lesson_teacher_start_idx'),
            models.Index(fields=['plan_status'], name='lesson_plan_status_idx'),
        ]

    @property
    def is_cancelled(self):
        return self.status in {
            LessonStatus.CANCELLED_BY_TEACHER,
            LessonStatus.CANCELLED_BY_STUDENT,
            LessonStatus.CANCELLED_BY_SYSTEM,
        }

    @property
    def is_finished(self):
        return self.status in {
            LessonStatus.COMPLETED,
            LessonStatus.NO_SHOW_TEACHER,
            LessonStatus.NO_SHOW_GROUP,
        }

    @property
    def is_plan_approved(self):
        return self.plan_status == PlanStatus.APPROVED

    @property
    def is_paid(self):
        return self.payout is not None

    def delete(self, using=None, keep_parents=False):
        if self.grade_column is not None:
            self.grade_column.delete_if_empty()
        super().delete(using, keep_parents)
