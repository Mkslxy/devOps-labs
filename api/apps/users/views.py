from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import generics, viewsets, permissions, views
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend

from .filters import UserFilter
from .models import User, ResetCode, Role
from .models.user import Language
from .serializers import CustomTokenObtainPairSerializer, RegistrationSerializer, UserSerializer, \
    ChangeLocalizationSerializer, ResetCodeRequestSerializer, CheckResetCodeRequestSerializer, \
    ResetPasswordRequestSerializer, SendEmailCodeSerializer, VerifyEmailCodeSerializer, RoleSerializer, \
    OrgChartUserSerializer
from .utils import set_auth_cookies
from apps.core.email.tasks import send_email_task
from ..core.utils import HasPermission, CustomPageNumberPagination
from ..finance.models import StudentSubscription, GiftCertificate
from ..finance.models.student_subsctiption import SubscriptionStatus
from ..support.filters import FeedbackFilterSet
from ..support.models import Feedback
from ..support.serializers import FeedbackSerializer


###
### AUTHENTICATION
###
@extend_schema(tags=['Authentication'])
class RegistrationView(generics.CreateAPIView):
    serializer_class = RegistrationSerializer
    permission_classes = (AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        access_token = refresh.access_token

        resp = Response(
            UserSerializer(user, context={"request": request}).data,
            status=201
        )

        set_auth_cookies(resp, str(access_token), str(refresh))

        return resp


@extend_schema(tags=['Authentication'])
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.user

        tokens = serializer.validated_data
        access_token = tokens.get('access')
        refresh_token = tokens.get('refresh')

        user_data = UserSerializer(user).data

        response = Response({
            "message": "success",
            "user": user_data,
        })

        set_auth_cookies(response, access_token, refresh_token)

        return response


@extend_schema(tags=['Authentication'])
class CustomTokenRefreshView(APIView):
    serializer_class = TokenRefreshSerializer
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        refresh = request.COOKIES.get('refresh-token')
        if refresh:
            try:
                data = request.data.copy()
                data['refresh'] = refresh

                serializer = self.serializer_class(data=data)
                serializer.is_valid(raise_exception=True)
            except (TokenError, InvalidToken):
                return Response(
                    {"message": "Invalid refresh token."},
                    status=400
                )

            new_access = serializer.validated_data.get('access')
            new_refresh = serializer.validated_data.get('refresh')

            response = Response(
                {"message": "Refreshed successfully."},
                status=200
            )

            set_auth_cookies(response, new_access, new_refresh)
            return response

        else:
            return Response(
                {"message": "Refresh token is missing in cookies."},
                status=401
            )


@extend_schema(tags=['Authentication'])
class LogoutView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        refresh = request.COOKIES.get('refresh-token')
        if refresh:
            try:
                refresh_token = RefreshToken(refresh)
                refresh_token.blacklist()
            except (TokenError, InvalidToken):
                pass

        response = Response({"message": "Successfully logged out."}, status=200)

        response.delete_cookie('access-token')
        response.delete_cookie('refresh-token')

        return response


@extend_schema(tags=['Email Verification'])
class SendEmailCodeView(APIView):
    permission_classes = (AllowAny,)
    serializer_class = SendEmailCodeSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.create_code()
        return Response({"message": "Code sent."}, status=200)


@extend_schema(tags=['Email Verification'])
class VerifyEmailCodeView(APIView):
    permission_classes = (AllowAny,)
    serializer_class = VerifyEmailCodeSerializer

    def post(self, request):
        ser = self.serializer_class(data=request.data)
        ser.is_valid(raise_exception=True)
        token = ser.create_token()
        return Response({"verification_token": token})


@extend_schema(
    tags=['Reset'],
    summary="Отримати код для відновлення пароля",
    description="Надсилає код відновлення на email користувача",
)
class GetResetCode(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ResetCodeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = get_object_or_404(User, email=email)

        ResetCode.objects.filter(user=user).delete()

        reset_code = ResetCode.generate_code()
        ResetCode.objects.create(user=user, code=reset_code)

        send_email_task.delay(
            subject='Password Reset Request',
            message=f"Ось ваш код для відновлення паролю: {reset_code}",
            recipient_list=[user.email],
        )
        return Response({'success': True}, status=200)


@extend_schema(
    tags=['Reset'],
    summary="Перевірити код відновлення",
    description="Перевіряє валідність коду відновлення пароля",
)
class CheckResetCode(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = CheckResetCodeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        code = serializer.validated_data['code']

        user = get_object_or_404(User, email=email)
        reset_code = get_object_or_404(ResetCode, user=user, code=code)

        if reset_code.is_valid():
            return Response({'success': True}, status=200)

        return Response({'success': False, "detail": "Reset code expired."}, 400)


@extend_schema(
    tags=['Reset'],
    summary="Змінити пароль",
    description="Змінює пароль користувача після підтвердження коду",
)
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ResetPasswordRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        password = serializer.validated_data['password']
        repeat_password = serializer.validated_data['repeat_password']

        if code is None:
            return Response({'success': False, "detail": "Reset code has not been provided."}, 400)

        if password != repeat_password:
            return Response({'success': False, "detail": "Passwords don't match."}, 400)

        user = get_object_or_404(User, email=email)
        reset_code = get_object_or_404(ResetCode, user=user, code=code)

        user.set_password(password)
        user.save()

        reset_code.delete()

        return Response({'success': True}, status=200)


###
### PROFILE
###
@extend_schema(tags=['Profile'])
class MyProfileView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        user = request.user
        if not user.has_permission('users.write'):
            request.data.pop('school_ids', None)

        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=200)


@extend_schema(tags=['Profile'])
class MyFeedbacksView(ReadOnlyModelViewSet):
    queryset = Feedback.objects.all()

    permission_classes = [IsAuthenticated]
    serializer_class = FeedbackSerializer

    filter_backends = (DjangoFilterBackend, OrderingFilter)
    filterset_class = FeedbackFilterSet
    ordering_fields = ['id', 'created_at', 'rating']
    ordering = ['-created_at']

    def get_queryset(self):
        return Feedback.objects.filter(created_by=self.request.user)


@extend_schema(tags=['Profile'])
class MyBossView(views.APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: dict})
    def get(self, request, *args, **kwargs):
        user = request.user
        role = user.role.slug

        user_school_ids = user.schools.values_list('id', flat=True)

        supervisors = User.objects.none()
        subordinates = User.objects.none()

        if role == 'teacher':
            supervisors = User.objects.filter(
                Q(role__slug__in=['operational_director', 'admin']) |
                Q(role__slug__in=['manager', 'methodist'], schools__id__in=user_school_ids)
            ).distinct()

        elif role == 'methodist':
            supervisors = User.objects.filter(
                Q(role__slug__in=['operational_director', 'admin']) |
                Q(role__slug='manager', schools__id__in=user_school_ids)
            ).distinct()
            subordinates = User.objects.filter(role__slug='teacher', schools__id__in=user_school_ids).distinct()

        elif role == 'manager':
            supervisors = User.objects.filter(role__slug__in=['operational_director', 'admin', 'financier']).distinct()
            subordinates = User.objects.filter(role__slug__in=['methodist', 'teacher'],
                                               schools__id__in=user_school_ids).distinct()

        elif role in ['operational_director', 'admin', 'financier']:
            supervisors = User.objects.none()
            subordinates = User.objects.exclude(id=user.id).distinct()

        return Response({
            "supervisors": OrgChartUserSerializer(supervisors, many=True).data,
            "subordinates": OrgChartUserSerializer(subordinates, many=True).data,
        })




###
### USERS CRUD
###
@extend_schema(tags=['Users'])
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (HasPermission,)

    pagination_class = CustomPageNumberPagination
    filter_backends = (DjangoFilterBackend,)
    filterset_class = UserFilter

    def get_required_permissions(self, request):
        if request.method not in permissions.SAFE_METHODS:
            return ['users.read', 'users.write']
        return ['users.read']


@extend_schema(tags=['Profile'])
class ChangeLocalization(APIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ChangeLocalizationSerializer

    def post(self, request, *args, **kwargs):
        language = request.data.get('language')
        if language not in dict(Language.choices):
            return Response({'message': 'Invalid language'}, status=400)

        user = request.user
        user.language_code = language
        user.save()
        return Response({'message': 'Localization changed'}, status=200)


@extend_schema(tags=["Roles"])
class RoleViewSet(ReadOnlyModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = (AllowAny,)
