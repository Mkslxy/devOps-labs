import os
from datetime import timedelta

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "UniSchool.settings")
django.setup()

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.classes.models import School, SchoolAffiliation
from apps.users.models import Permission, Role, User


ALL_QA_PERMISSIONS = [
    "callback-request.read",
    "callback-request.write",
    "courses.manage_all",
    "courses.read",
    "courses.write",
    "feedbacks.manage_all",
    "gradebook.manage_all",
    "gradebook.read",
    "gradebook.read_teacher",
    "gradebook.write",
    "groups.read",
    "groups.write",
    "homework.check",
    "homework.manage_all",
    "homework.read",
    "homework.read_teacher",
    "homework.write",
    "leads.read",
    "leads.write",
    "lesson-plans.check",
    "lessons.manage_all",
    "lessons.read",
    "lessons.write",
    "magic-import.courses",
    "magic-import.tests",
    "schools.manage_all",
    "staff_meeting.read",
    "staff_meeting.write",
    "tasks.manage_all",
    "tasks.read",
    "tasks.write",
    "test.manage_all",
    "tests.manage_all",
    "tests.manage_onboardings",
    "tests.read",
    "tests.read_teacher",
    "tests.write",
    "trainings.read",
    "trainings.write",
    "users.read",
    "users.write",
]


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def make_role(db):
    def _make_role(slug="admin", permissions=None):
        role, _ = Role.objects.get_or_create(
            slug=slug,
            defaults={"name": slug.replace("_", " ").title()},
        )
        if permissions is not None:
            permission_objects = [
                Permission.objects.get_or_create(
                    slug=slug,
                    defaults={"description": f"QA permission for {slug}"},
                )[0]
                for slug in permissions
            ]
            role.permissions.set(permission_objects)
        return role

    return _make_role


@pytest.fixture
def make_user(db, make_role):
    counter = {"value": 0}

    def _make_user(role_slug="admin", permissions=None, **kwargs):
        counter["value"] += 1
        role = kwargs.pop("role", None) or make_role(role_slug, permissions)
        suffix = counter["value"]
        email = kwargs.pop("email", f"{role_slug}{suffix}@example.com")
        phone = kwargs.pop("phone_normalized", f"+1555000{suffix:04d}")

        return User.objects.create_user(
            email=email,
            password=kwargs.pop("password", "StrongPass123!"),
            full_name=kwargs.pop("full_name", f"{role_slug.title()} User {suffix}"),
            phone_country_code=kwargs.pop("phone_country_code", "+1"),
            phone_national_number=kwargs.pop("phone_national_number", f"555000{suffix:04d}"),
            phone_normalized=phone,
            role=role,
            **kwargs,
        )

    return _make_user


@pytest.fixture
def admin_user(make_user):
    return make_user(role_slug="admin", permissions=ALL_QA_PERMISSIONS, email="qa-admin@example.com")


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def school(db):
    return School.objects.create(
        name="QA School",
        address="1 Test Street",
        city="Kyiv",
        latitude=50.450001,
        longitude=30.523333,
    )


@pytest.fixture
def teacher_user(make_user, school):
    user = make_user(role_slug="teacher", permissions=["lessons.read", "homework.read_teacher"])
    SchoolAffiliation.objects.create(user=user, school=school)
    return user


@pytest.fixture
def student_user(make_user, school):
    user = make_user(role_slug="student", permissions=["homework.read", "tests.read", "gradebook.read"])
    SchoolAffiliation.objects.create(user=user, school=school)
    return user


@pytest.fixture
def future_start():
    return timezone.now() + timedelta(days=3)
