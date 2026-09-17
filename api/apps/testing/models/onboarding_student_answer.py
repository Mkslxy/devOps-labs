from django.db import models


class OnboardingStudentAnswer(models.Model):
    attempt = models.ForeignKey(
        'testing.OnboardingTestAttempt',
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question = models.ForeignKey(
        'testing.Question',
        on_delete=models.CASCADE
    )
    score_awarded = models.FloatField(default=0.0)
    teacher_comment = models.TextField(blank=True)

    class Meta:
        db_table = 'onboarding_student_answers'
        unique_together = ('attempt', 'question')
