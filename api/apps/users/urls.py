from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.users.views import CustomTokenObtainPairView, RegistrationView, LogoutView, CustomTokenRefreshView, \
    UserViewSet, MyProfileView, ChangeLocalization, GetResetCode, CheckResetCode, ResetPasswordView, \
    VerifyEmailCodeView, SendEmailCodeView, RoleViewSet, MyFeedbacksView, MyBossView

router = DefaultRouter()
router.register('users', UserViewSet, basename='users')
router.register('roles', RoleViewSet, basename='roles')
auth_patterns = [
    path('login/', CustomTokenObtainPairView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('register/', RegistrationView.as_view()),
    path('refresh/', CustomTokenRefreshView.as_view()),
]

email_verification_patterns = [
    path('email/send-code/', SendEmailCodeView.as_view()),
    path('email/', VerifyEmailCodeView.as_view()),
]

restore_patterns = [
    path('send-code/', GetResetCode.as_view(), name='send-reset-code'),
    path('check-code/', CheckResetCode.as_view(), name='user-check-reset-code'),
    path('reset-password/', ResetPasswordView.as_view(), name='user-reset-password'),
]

profile_router = DefaultRouter()
profile_router.register('my-feedbacks', MyFeedbacksView, 'my-feedbacks')
profile_patterns = [
    path('me/', MyProfileView.as_view(), name='get-me'),
    path('change-localization/', ChangeLocalization.as_view(), name='change-localization'),
    path('roles-tree/', MyBossView.as_view(), name='roles-tree'),
    path('', include(profile_router.urls)),
]

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include(auth_patterns)),
    path('verify/', include(email_verification_patterns)),
    path('restore/', include(restore_patterns)),
    path('profile/', include(profile_patterns)),
]
