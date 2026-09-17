from django.db import models


class StudentAnswerItem(models.Model):
    student_answer = models.ForeignKey(
        'testing.StudentAnswer',
        on_delete=models.CASCADE,
        related_name='items'
    )
    selected_option = models.ForeignKey(
        'testing.QuestionOption',
        on_delete=models.CASCADE,
        null=True, blank=True

    )
    text_response = models.TextField(blank=True)
    placeholder_index = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'student_answer_items'
