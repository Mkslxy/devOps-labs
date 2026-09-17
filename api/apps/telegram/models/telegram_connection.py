from django.db import models


class TelegramConnection(models.Model):
    user = models.OneToOneField('users.User', blank=True, null=True, on_delete=models.CASCADE)
    tg_id = models.BigIntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'tg_id')
