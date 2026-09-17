from random import choice
from string import digits
from datetime import timedelta, UTC, datetime

from django.db import models

from apps.users.models import User


def expire_in_15_minutes():
    return datetime.now(UTC) + timedelta(minutes=15)


class ResetCode(models.Model):
    code = models.CharField(max_length=10, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    expire_at = models.DateTimeField(default=expire_in_15_minutes)

    class Meta:
        indexes = [
            models.Index(fields=['expire_at'], name='reset_code_expire_idx'),
        ]

    def is_valid(self) -> bool:
        return self.expire_at > datetime.now(UTC)

    @staticmethod
    def generate_code(length=6):
        return "".join(choice(digits) for _ in range(length))
