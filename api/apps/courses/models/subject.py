from django.db import models
from django.utils.text import slugify
from unidecode import unidecode

from apps.core.models import TimeStampedModel


class Subject(TimeStampedModel):
    name = models.CharField(max_length=255, unique=True, help_text="English, Volapük, ...")
    slug = models.SlugField(max_length=255, unique=True)

    class Meta:
        db_table = 'subjects'

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(unidecode(self.name)) or "subject"
            slug = base_slug
            counter = 1

            while Subject.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            self.slug = slug

        super().save(*args, **kwargs)
