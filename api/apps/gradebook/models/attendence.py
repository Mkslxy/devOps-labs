from django.db import models
from rest_framework.exceptions import ValidationError


class AttendanceCategory(models.TextChoices):
    PRESENT = 'present', 'Present'
    ABSENT = 'absent', 'Absent'
    LATE = 'late', 'Late'


class   Attendance(models.Model):
    column = models.ForeignKey('gradebook.GradeColumn', on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='attendance')
    student = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='attendances')

    category = models.CharField(max_length=20, choices=AttendanceCategory.choices, default=AttendanceCategory.PRESENT)
    late_minutes = models.IntegerField(default=0)
    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'attendance'
        indexes = [
            models.Index(fields=['category'], name='attendance_category_idx'),
        ]

    def clean(self):
        if self.category != AttendanceCategory.LATE and self.late_minutes > 0:
            raise ValidationError('Late minutes must be 0 if category is not late')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
