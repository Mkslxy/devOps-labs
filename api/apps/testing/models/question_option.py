from django.db import models


class QuestionOption(models.Model):
    question = models.ForeignKey('testing.Question', on_delete=models.CASCADE, related_name='options')

    option_text = models.TextField()
    is_correct = models.BooleanField(default=False)

    explanation = models.TextField(blank=True)

    correct_order = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="For Ordering questions: the correct position (1, 2, 3)"
    )

    match_pair_text = models.CharField(
        max_length=500, null=True, blank=True,
        help_text="For Matching questions: the right side of the pair"
    )

    blank_group_id = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="For Fill-in-the-blank: ID of the gap (1, 2...)"
    )

    class Meta:
        db_table = 'question_options'
