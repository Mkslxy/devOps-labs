import datetime

from django.db import models


class GradeColumn(models.Model):
    title = models.CharField(max_length=255)
    comment = models.TextField(blank=True)

    group = models.ForeignKey('classes.Group', on_delete=models.CASCADE)

    date = models.DateField(default=datetime.date.today)

    class Meta:
        db_table = 'grade_columns'
        indexes = [
            models.Index(fields=['-date'], name='grade_col_date_desc_idx'),
            models.Index(fields=['group', '-date'], name='grade_col_group_date_idx'),
        ]

    @property
    def has_grades(self):
        return self.grades.exists()

    def delete_if_empty(self):
        if not self.has_grades:
            self.delete()
