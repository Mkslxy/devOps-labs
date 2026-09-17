from django.db import models


class LessonType(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    duration_minutes = models.PositiveIntegerField(help_text="Тривалість у хвилинах")

    class Meta:
        db_table = 'lesson_types'

    def __str__(self):
        return f"{self.name} ({self.duration_minutes} хв)"
