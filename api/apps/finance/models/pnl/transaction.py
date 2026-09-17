from django.db import models

from apps.core.models import TimeStampedModel


class TransactionType(models.TextChoices):
    INCOME = 'income'
    EXPENSE = 'expense'


class Transaction(TimeStampedModel):
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    type = models.CharField(max_length=10, choices=TransactionType.choices, default=TransactionType.INCOME)
    description = models.TextField(null=True, blank=True)

    category = models.ForeignKey(
        'finance.Category',
        blank=True, null=True,
        on_delete=models.SET_NULL,
        related_name='transactions'
    )
    subcategory = models.ForeignKey(
        'finance.SubCategory',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='transactions'
    )
    payment_method = models.ForeignKey(
        'finance.PaymentMethod',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='transactions'
    )
    currency = models.ForeignKey(
        'finance.Currency',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='transactions'
    )

    school = models.ForeignKey(
        'classes.School',
        null=True, blank=True,
        on_delete=models.PROTECT,
        related_name='transactions'
    )

    class Meta:
        db_table = 'pnl_transaction'
        indexes = [
            models.Index(fields=['-created_at'], name='txn_created_desc_idx'),
            models.Index(fields=['school', '-created_at'], name='txn_school_created_idx'),
            models.Index(fields=['type'], name='txn_type_idx'),
        ]
