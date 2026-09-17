from django.db import models


class Currency(models.Model):
    code = models.CharField(
        max_length=15,
        unique=True,
        help_text="USD, UAH, ..."
    )
    name = models.CharField(max_length=50, help_text="Долар, ще якась канєтєль")
    symbol = models.CharField(max_length=10, help_text="$, 卍, ...")

    class Meta:
        db_table = 'pnl_currency'
