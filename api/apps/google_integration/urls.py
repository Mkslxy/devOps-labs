from django.urls import path

from apps.google_integration.views import GoogleCallbackView, GoogleConnectView, GoogleColorsView, GoogleDisconnectView

urlpatterns = [
    path('connect/', GoogleConnectView.as_view()),
    path('callback/', GoogleCallbackView.as_view()),
    path('colors/', GoogleColorsView.as_view()),
    path('disconnect/', GoogleDisconnectView.as_view()),

]
