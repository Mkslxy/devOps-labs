from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.gradebook.views import GradeColumnViewSet, GradeViewSet, AttendanceViewSet, GradebookGridView

router = DefaultRouter()
router.register(r'grade', GradeViewSet, basename='gradebook')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'column', GradeColumnViewSet, basename='grade-column')

urlpatterns = [
    path('grid/', GradebookGridView.as_view(), name='gradebook-grid'),
    path('', include(router.urls)),
]
