from datetime import date

from django.db import models


def upload_to_document(instance, filename):
    today = date.today()
    doc_name = instance.document.__class__.__name__ if instance.document else 'unknown'

    return f"{doc_name}/{today.year}/{today.month:02d}/{filename}"


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AbstractFile(models.Model):
    document = None
    file = models.FileField(upload_to=upload_to_document)
    name = models.CharField(max_length=255, blank=True)

    class Meta:
        abstract = True


class AbstractLink(models.Model):
    document = None
    url = models.URLField()
    name = models.CharField(max_length=255, blank=True)

    is_video_embed = models.BooleanField(default=False)

    class Meta:
        abstract = True
