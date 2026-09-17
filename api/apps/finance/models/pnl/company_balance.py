from django.db import models

from apps.core.models import TimeStampedModel


class CompanyBalance(TimeStampedModel):
    currency = models.OneToOneField(
        'finance.Currency',
        on_delete=models.PROTECT,
        related_name='company_balance'
    )
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table = 'pnl_company_balance'
