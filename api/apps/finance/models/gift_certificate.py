import uuid
from django.db import models
from django.utils import timezone
from apps.core.models import TimeStampedModel


class GiftCertificate(TimeStampedModel):
    code = models.CharField(max_length=50, unique=True, blank=True)

    plan = models.ForeignKey('finance.SubscriptionPlan', on_delete=models.PROTECT, related_name='gift_certificates')
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Сума, яку реально заплатили")

    purchaser = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='purchased_gifts')
    purchaser_name = models.CharField(max_length=255)
    purchaser_email = models.EmailField()

    issued_to_email = models.EmailField(help_text="Email друга, якому прийде подарунок")
    issued_to_name = models.CharField(max_length=255, blank=True, help_text="Ім'я друга для красивого листа")

    is_paid = models.BooleanField(default=False, help_text="Стає True після успішної оплати у WayForPay")
    is_used = models.BooleanField(default=False)

    redeemed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='redeemed_gifts')

    redeemed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'gift_certificates'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['issued_to_email'], name='gift_issued_email_idx'),
        ]

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = f"GIFT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    @property
    def is_valid(self):
        if self.is_used or not self.is_paid:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True
