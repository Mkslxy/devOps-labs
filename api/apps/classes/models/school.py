from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class School(models.Model):
    name = models.CharField(max_length=100, unique=True)
    address = models.CharField(max_length=100)
    city = models.CharField(max_length=100)

    latitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        null=True, blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )

    longitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        null=True, blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )

    class Meta:
        db_table = "schools"
        indexes = [
            models.Index(fields=['city'], name='school_city_idx'),
        ]
