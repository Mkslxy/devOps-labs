from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.crm.views import LeadViewSet

router = DefaultRouter()
router.register('leads', LeadViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
