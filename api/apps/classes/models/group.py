from django.db import models

from apps.users.models import User


class GroupStatus(models.TextChoices):
    RECRUITING = 'recruiting', 'Recruiting'
    ACTIVE = 'active', 'Active'
    FINISHED = 'finished', 'Finished'
    ARCHIVED = 'archived', 'Archived'


class AgeGroup(models.TextChoices):
    KIDS = 'kids', 'Kids'
    TEENS = 'teens', 'Teens'
    ADULTS = 'adults', 'Adults'


class KnowledgeLevel(models.TextChoices):
    BEGINNER = 'beginner', 'Beginner'
    ELEMENTARY = 'elementary', 'Elementary'
    PRE_INTERMEDIATE = 'pre_intermediate', 'Pre-Intermediate'
    INTERMEDIATE = 'intermediate', 'Intermediate'
    UPPER_INTERMEDIATE = 'upper_intermediate', 'Upper-Intermediate'
    ADVANCED = 'advanced', 'Advanced'


class Group(models.Model):
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='groups'
    )

    school = models.ForeignKey(
        'classes.School',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='groups'
    )

    teacher = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='teaching_groups',
        limit_choices_to={'role__slug': 'teacher'},
    )

    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=GroupStatus.choices, default=GroupStatus.ACTIVE)

    age_group = models.CharField(max_length=20, choices=AgeGroup.choices)
    knowledge_level = models.CharField(max_length=30, choices=KnowledgeLevel.choices)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_online = models.BooleanField()

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'groups'
        indexes = [
            models.Index(
                fields=['status'],
                name='group_status_open_idx',
                condition=~models.Q(status__in=[GroupStatus.FINISHED, GroupStatus.ARCHIVED]),
            ),
            models.Index(fields=['school', 'status'], name='group_school_status_idx'),
        ]
