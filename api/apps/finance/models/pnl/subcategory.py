from django.db import models


class SubCategory(models.Model):
    name = models.CharField(max_length=255)
    category = models.ForeignKey('finance.Category', on_delete=models.CASCADE, related_name='subcategories')

    class Meta:
        db_table = 'pnl_subcategory'
