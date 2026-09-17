from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.support.views import CallbackRequestViewSet, FeedbackViewSet

router = DefaultRouter()
router.register(r'callback-request', CallbackRequestViewSet, basename='callback-request')
router.register(r'feedbacks', FeedbackViewSet, basename='feedback')

urlpatterns = [
    path('', include(router.urls)),
]
