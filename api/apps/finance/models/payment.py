from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel
import uuid


class PaymentStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    DECLINED = 'declined', 'Declined'
    REFUNDED = 'refunded', 'Refunded'
    EXPIRED = 'expired', 'Expired'


class PaymentType(models.TextChoices):
    NEW_SUBSCRIPTION = 'new_sub', 'New Subscription'
    TOP_UP = 'top_up', 'Top Up Extra Lessons'
    GIFT = 'gift', 'Gift Certificate'


class Payment(TimeStampedModel):
    order_reference = models.CharField(max_length=255, unique=True)

    payment_type = models.CharField(
        max_length=20,
        choices=PaymentType.choices,
        default=PaymentType.NEW_SUBSCRIPTION
    )

    user = models.ForeignKey('users.User', on_delete=models.RESTRICT, null=True, blank=True)

    # Покупка
    plan = models.ForeignKey('finance.SubscriptionPlan', on_delete=models.SET_NULL, null=True)

    # Докупка
    target_subscription = models.ForeignKey(
        'finance.StudentSubscription',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='top_up_payments'
    )
    extra_lessons = models.IntegerField(null=True, blank=True)

    # Подарунок без авторизації
    guest_email = models.EmailField(null=True, blank=True)
    target_gift = models.ForeignKey('finance.GiftCertificate', on_delete=models.SET_NULL, null=True, blank=True)

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='UAH')

    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)

    response_code = models.CharField(max_length=50, blank=True, null=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payments'
        indexes = [
            models.Index(fields=['status'], name='payment_status_idx'),
            models.Index(fields=['-created_at'], name='payment_created_desc_idx'),
        ]

    def save(self, *args, **kwargs):
        if not self.order_reference:
            self.order_reference = f"SUB-{uuid.uuid4().hex[:8].upper()}-{int(timezone.now().timestamp())}"
        super().save(*args, **kwargs)
