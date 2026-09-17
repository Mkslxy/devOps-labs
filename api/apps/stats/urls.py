from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.stats.dashboard_views import ManagerDashboardView, TeacherDashboardView, StudentDashboardView
from apps.stats.views import StudentPerformanceViewSet, GroupPerformanceView

router = DefaultRouter()
router.register(r'', StudentPerformanceViewSet, basename='StudentPerformance')

urlpatterns = [
    path('', include(router.urls)),
    path('group/<int:group_id>', GroupPerformanceView.as_view()),
    path('dashboard/manager/', ManagerDashboardView.as_view()),
    path('dashboard/teacher/', TeacherDashboardView.as_view()),
    path('dashboard/student/', StudentDashboardView.as_view()),
]
