from django.db import models


class QuestionType(models.TextChoices):
    SINGLE_CHOICE = 'single_choice', 'Single Choice'
    MULTIPLE_CHOICE = 'multiple_choice', 'Multiple Choice'
    OPEN_TEXT = 'open_text', 'Open Text'
    FILL_IN_THE_BLANK = 'fill_in_the_blank', 'Fill in the blank'
    MATCHING = 'matching', 'Matching'
    ORDERING = 'ordering', 'Ordering'


class Question(models.Model):
    text = models.TextField(
        help_text="Для Fill-in-blank питань юзаєм плейсхолдери, наприклад: 'London is the capital of {1}'")
    media_url = models.URLField(blank=True, null=True)
    points = models.FloatField(default=1)
    type = models.CharField(max_length=20, choices=QuestionType.choices)
    explanation = models.TextField(blank=True)

    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_question_options'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'questions'
        indexes = [
            models.Index(fields=['type'], name='question_type_idx'),
            models.Index(fields=['-created_at'], name='question_created_desc_idx'),
        ]
