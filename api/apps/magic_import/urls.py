from django.urls import path

from apps.magic_import.views import TestMagicImportView, CourseMagicImportView

urlpatterns = [
    path('test-import/', TestMagicImportView.as_view()),
    path('course-import/', CourseMagicImportView.as_view()),
]
