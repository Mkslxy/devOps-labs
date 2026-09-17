from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.testing.views import TestViewSet, TestVersionViewSet, QuestionViewSet, TestAssignmentViewSet, \
    TestAttemptViewSet, StudentAnswerViewSet, TeacherAttemptViewSet, OnboardingTestAssignmentViewSet, \
    OnboardingTestAttemptViewSet, OnboardingStudentAnswerViewSet, OnboardingTeacherAttemptViewSet, \
    TestAssignmentInfoViewSet

### TEACHER ROUTER
teacher_router = DefaultRouter()
teacher_router.register('tests', TestViewSet)
teacher_router.register('test-versions', TestVersionViewSet)
teacher_router.register('questions', QuestionViewSet)
teacher_router.register('test-assignments', TestAssignmentViewSet)
teacher_router.register('test-answer-review', StudentAnswerViewSet)
teacher_router.register('student-results', TeacherAttemptViewSet, basename='teacher-results')

### TEACHER ONBOARDING ROUTER
onboarding_teacher_router = DefaultRouter()
onboarding_teacher_router.register('test-assignments', OnboardingTestAssignmentViewSet)
onboarding_teacher_router.register('test-answer-review', OnboardingStudentAnswerViewSet)
onboarding_teacher_router.register('student-results', OnboardingTeacherAttemptViewSet)

### STUDENT ROUTER
student_router = DefaultRouter()
student_router.register('test-assignments', TestAttemptViewSet)

### STUDENT ONBOARDING ROUTER
onboarding_student_router = DefaultRouter()
onboarding_student_router.register('test-assignments', OnboardingTestAttemptViewSet)

urlpatterns = [
    path('test-management/', include(teacher_router.urls)),
    path('test-taking/', include(student_router.urls)),

    path('test-management/onboarding/', include(onboarding_teacher_router.urls)),
    path('test-taking/onboarding/', include(onboarding_student_router.urls)),

    path('share/test-assignments/<uuid:public_uid>/', TestAssignmentInfoViewSet.as_view({'get': 'retrieve'})),
]
