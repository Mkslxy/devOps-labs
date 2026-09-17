from datetime import timedelta

from django.db import models
from django.utils import timezone


class EmailVerification(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['email'], name='email_verify_email_idx'),
            models.Index(fields=['created_at'], name='email_verify_created_idx'),
        ]

    def is_expired(self):
        return (timezone.now() - self.created_at) > timedelta(minutes=10)
