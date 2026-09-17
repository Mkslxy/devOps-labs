from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.contrib.auth.models import AbstractUser

from apps.core.models import TimeStampedModel
from apps.users.utils import get_default_role_id


class UserRole(models.TextChoices):
    STUDENT = 'student', 'Student'
    TEACHER = 'teacher', 'Teacher'
    METHODIST = 'methodist', 'Methodist'
    MANAGER = 'manager', 'Manager'
    OPERATIONAL_DIRECTOR = 'operational_director', 'Operational Director'
    FINANCIER = 'financier', 'Financier'
    ADMIN = 'admin', 'Admin'


class Language(models.TextChoices):
    UKR = 'uk', 'Ukrainian'
    ENG = 'en', 'English'


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('full_name', 'Super Admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser, TimeStampedModel):
    username = None
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField(null=True, blank=True)

    phone_country_code = models.CharField(max_length=5)
    phone_national_number = models.CharField(max_length=20)
    phone_normalized = models.CharField(max_length=25, unique=True)

    city = models.CharField(max_length=50, null=True)

    role = models.ForeignKey(
        'users.Role',
        on_delete=models.PROTECT,
        default=get_default_role_id,
        related_name='users'
    )
    language_code = models.CharField(max_length=10, choices=Language.choices, default=Language.UKR)

    google_refresh_token = models.CharField(max_length=255, blank=True, null=True)
    google_calendar_id = models.CharField(max_length=255, blank=True, null=True)
    is_google_calendar_connected = models.BooleanField(default=False)

    supervisor = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    onboarding_status = models.CharField(max_length=50, default='new')

    groups = models.ManyToManyField(
        'classes.Group',
        through='classes.GroupStudent',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name="custom_user_set",
        related_query_name="user",
    )
    schools = models.ManyToManyField(
        'classes.School',
        through='classes.SchoolAffiliation',
        verbose_name='schools',
        blank=True,
        help_text='The schools this user belongs to.',
        related_name="affiliated_users",
        related_query_name="user",
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'role']
    objects = CustomUserManager()

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['full_name'], name='user_full_name_idx'),
            models.Index(
                fields=['onboarding_status'],
                name='user_onboarding_new_idx',
                condition=models.Q(onboarding_status='new'),
            ),
            models.Index(
                fields=['is_google_calendar_connected'],
                name='user_google_cal_connected_idx',
                condition=models.Q(is_google_calendar_connected=True),
            ),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=['phone_country_code', 'phone_national_number'],
                name='unique_full_phone'
            )
        ]

    def has_permission(self, perm_slug):
        if self.is_superuser:
            return True

        if not self.role:
            return False

        return self.role.permissions.filter(slug=perm_slug).exists()
