from django.db import models

from apps.core.models import TimeStampedModel


class SchoolBalance(TimeStampedModel):
    school = models.ForeignKey(
        'classes.School',
        on_delete=models.CASCADE,
        related_name='balances'
    )
    currency = models.ForeignKey(
        'finance.Currency',
        on_delete=models.PROTECT
    )

    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table = 'pnl_school_balance'
        unique_together = ('school', 'currency')
