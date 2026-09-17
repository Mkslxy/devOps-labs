import random
import string
from datetime import date

from django.conf import settings
from django.db import connection


def set_auth_cookies(response, access_token, refresh_token):
    access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
    refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
    auth_cookie_samesite = getattr(settings, 'AUTH_COOKIE_SAMESITE', 'Lax')
    auth_cookie_secure = getattr(settings, 'AUTH_COOKIE_SECURE', not settings.DEBUG)
    if not isinstance(auth_cookie_secure, bool):
        auth_cookie_secure = not settings.DEBUG

    response.set_cookie(
        key='access-token',
        value=access_token,
        max_age=int(access_lifetime.total_seconds()),
        httponly=True,
        samesite=auth_cookie_samesite,
        secure=auth_cookie_secure
    )

    response.set_cookie(
        key='refresh-token',
        value=refresh_token,
        max_age=int(refresh_lifetime.total_seconds()),
        httponly=True,
        samesite=auth_cookie_samesite,
        secure=auth_cookie_secure,
    )


def years_ago(years: int) -> date:
    today = date.today()
    try:
        return today.replace(year=today.year - years)
    except ValueError:
        return today.replace(month=2, day=28, year=today.year - years)


def generate_random_password(length=8):
    characters = string.ascii_letters + string.digits + string.punctuation

    password = ''.join(random.choice(characters) for _ in range(length))
    return password


def get_default_role_id():
    from django.db.utils import OperationalError, ProgrammingError
    try:
        if "users_role" not in connection.introspection.table_names():
            return None

        from apps.users.models import Role
        role, _ = Role.objects.get_or_create(
            slug='student',
            defaults={'name': 'Student'}
        )
        return role.id
    except (OperationalError, ProgrammingError, Exception):
        return None
