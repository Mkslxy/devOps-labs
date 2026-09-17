from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.courses.views import CourseViewSet, CourseModuleViewSet, CourseTopicViewSet, MaterialViewSet, SubjectViewSet, \
    TaskViewSet, TaskSubmissionViewSet, TaskSubmissionReviewViewSet

router = DefaultRouter()
router.register('course', CourseViewSet, basename='courses')
router.register('module', CourseModuleViewSet, basename='module')
router.register('topic', CourseTopicViewSet, basename='topic')
router.register('material', MaterialViewSet, basename='material')
router.register('subject', SubjectViewSet, basename='subject')

router.register('task', TaskViewSet, basename='task')
router.register('task-submission', TaskSubmissionViewSet, basename='task-submission')
router.register('task-submission-review', TaskSubmissionReviewViewSet, basename='task-submission-review')

urlpatterns = [
    path('', include(router.urls)),
]
