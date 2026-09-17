from django.db import models


class SchoolAffiliation(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='school_affiliations')
    school = models.ForeignKey('classes.School', on_delete=models.CASCADE, related_name='school_affiliations')

    class Meta:
        db_table = 'school_affiliations'
        unique_together = ('user', 'school')
