from django.db import models

from apps.core.models import TimeStampedModel


class LeadStatus(models.TextChoices):
    NEW = 'new', 'New'
    PROCESSING = 'processing', 'Processing'
    CONVERTED = 'converted', 'Converted'
    REJECTED = 'rejected', 'Rejected'


class Lead(TimeStampedModel):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, unique=True, blank=True, null=True)

    source = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=LeadStatus.choices, default=LeadStatus.NEW)
    notes = models.TextField(blank=True)
    manager = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    city = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'leads'
        indexes = [
            models.Index(
                fields=['status'],
                name='lead_status_open_idx',
                condition=models.Q(status__in=[LeadStatus.NEW, LeadStatus.PROCESSING]),
            ),
            models.Index(fields=['manager', 'status'], name='lead_manager_status_idx'),
            models.Index(fields=['email'], name='lead_email_idx'),
        ]
