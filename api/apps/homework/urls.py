from rest_framework.routers import DefaultRouter

from apps.homework.views import HomeworkViewSet, HomeworkSubmissionViewSet, HomeworkSubmissionReviewViewSet

router = DefaultRouter()
router.register('homework', HomeworkViewSet, basename='homework')
router.register('homework-submission', HomeworkSubmissionViewSet, basename='homework-submission')
router.register('homework-submission-review', HomeworkSubmissionReviewViewSet, basename='homework-submission-review')

urlpatterns = router.urls
