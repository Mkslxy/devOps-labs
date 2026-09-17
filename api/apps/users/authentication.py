from django.utils import translation
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

from apps.users.models import User


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get('access-token')

        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except AuthenticationFailed:
            return None

        user = self.get_user(validated_token)
        if user:
            user = User.objects.select_related('role').prefetch_related('role__permissions').get(id=user.id)

            if user.language_code:
                translation.activate(user.language_code)

        return user, validated_token
