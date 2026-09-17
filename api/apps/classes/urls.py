from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.classes.views import GroupViewSet, LessonViewSet, TrainingViewSet, LessonTypeViewSet, StaffMeetingViewSet, \
    SchoolViewSet, TaskViewSet

router = DefaultRouter()
router.register('tasks', TaskViewSet, basename='tasks')
router.register('groups', GroupViewSet, basename='groups')
router.register('lessons', LessonViewSet, basename='lessons')
router.register(r"schools", SchoolViewSet, basename="schools")
router.register(r'trainings', TrainingViewSet, basename='trainings')
router.register(r"lesson-types", LessonTypeViewSet, basename="lesson-type")
router.register(r"staff-meeting", StaffMeetingViewSet, basename="staff-meeting")

urlpatterns = [
    path('', include(router.urls)),
]
