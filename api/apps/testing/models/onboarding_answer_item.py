from django.db import models


class OnboardingStudentAnswerItem(models.Model):
    student_answer = models.ForeignKey(
        'testing.OnboardingStudentAnswer',
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
        db_table = 'onboarding_student_answer_items'
