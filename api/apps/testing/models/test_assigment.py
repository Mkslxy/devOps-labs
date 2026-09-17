import uuid

from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.testing.models import Test, TestVersion


class TestAssignment(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    public_uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    lesson = models.ForeignKey(
        'classes.Lesson',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='test_assignments'
    )
    material = models.ForeignKey(
        'courses.Material',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='test_assignments'
    )
    group = models.ForeignKey(
        'classes.Group',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='test_assignments'
    )

    custom_time_limit = models.IntegerField(
        null=True, blank=True,
        help_text="Override original test time limit (minutes)"
    )
    custom_passing_score = models.IntegerField(
        null=True, blank=True,
        help_text="Override passing score (%)"
    )

    pinned_version = models.ForeignKey(
        TestVersion,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assignments'
    )

    grade_column = models.ForeignKey('gradebook.GradeColumn', on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='test_assignment')

    show_answers = models.BooleanField(default=True)

    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    starting_at = models.DateTimeField(default=timezone.now)
    closing_at = models.DateTimeField(
        null=True, blank=True,
        help_text="Override original test closing time"
    )

    class Meta:
        db_table = 'test_assignments'
        verbose_name = 'Test Assignment'
        verbose_name_plural = 'Test Assignments'

    def clean(self):
        connections_count = sum([
            bool(self.lesson),
            bool(self.material),
            bool(self.group),
        ])

        if connections_count > 1:
            raise ValidationError(
                {"message": "Test should be assigned to either a lesson or a material or a group, not both."}
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @property
    def context_type(self):
        if self.lesson: return 'lesson'
        if self.material: return 'material'
        return 'standalone'

    @property
    def actual_version(self):
        if self.pinned_version:
            return self.pinned_version
        return self.test.current_version

    def delete(self, using=None, keep_parents=False):
        if self.grade_column is not None:
            self.grade_column.delete_if_empty()
        super().delete(using, keep_parents)
