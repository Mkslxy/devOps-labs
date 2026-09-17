from django.db import models
from rest_framework.exceptions import ValidationError

from apps.core.models import TimeStampedModel


class RequestStatus(models.TextChoices):
    NEW = 'new', 'New'
    IN_PROGRESS = 'in_progress', 'In Progress'
    CONVERTED = 'converted', 'Converted to Lead'
    REJECTED = 'rejected', 'Rejected / Spam'
    ARCHIVED = 'archived', 'Archived'


class ContactPreference(models.TextChoices):
    PHONE = 'phone', 'Phone Call'
    EMAIL = 'email', 'Email'
    OTHER = 'other', 'Other'


class CallbackRequest(TimeStampedModel):
    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)

    phone_country_code = models.CharField(max_length=5)
    phone_national_number = models.CharField(max_length=20)
    phone_normalized = models.CharField(max_length=25)

    message = models.TextField(blank=True)
    contact_preference = models.CharField(max_length=20, choices=ContactPreference.choices,
                                          default=ContactPreference.PHONE)
    other_contact_preference = models.CharField(max_length=255, blank=True, null=True)

    status = models.CharField(max_length=20, choices=RequestStatus.choices, default=RequestStatus.NEW)
    callback_page = models.URLField(max_length=512)

    city = models.CharField(max_length=100, blank=True, null=True)

    converted_lead = models.ForeignKey(
        'crm.Lead',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='original_request'
    )

    processed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    manager_comment = models.TextField(blank=True)

    class Meta:
        db_table = 'callback_request'

    def clean(self):
        if self.contact_preference == ContactPreference.OTHER and not self.other_contact_preference:
            raise ValidationError({
                'other_contact_preference': 'Please specify the contact method if "Other" is selected.'
            })

        if self.contact_preference == ContactPreference.EMAIL and not self.email:
            raise ValidationError({
                'email': 'Email is required when "Email" is selected as preferred contact.'
            })

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
