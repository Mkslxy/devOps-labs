from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from rest_framework.exceptions import ValidationError


class FeedbackType(models.TextChoices):
    COMPLAINT = 'COMPLAINT'
    FEEDBACK = 'FEEDBACK'
    WISH = 'WISH'


class Feedback(models.Model):
    type = models.CharField(choices=FeedbackType.choices, max_length=15, default=FeedbackType.FEEDBACK)

    lesson = models.ForeignKey(
        'classes.Lesson',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='feedbacks'
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='feedbacks'
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='feedbacks_received'
    )

    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    comment = models.TextField(blank=True)

    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='feedbacks_given')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feedbacks'

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def clean(self):
        conn_count = sum([
            bool(self.lesson),
            bool(self.course),
            bool(self.user),
        ])
        if conn_count > 1 or conn_count == 0:
            raise ValidationError("You have to have only one connected object (lesson, course, user).")
