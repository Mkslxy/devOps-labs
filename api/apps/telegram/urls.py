from django.urls import path

from apps.telegram.views import TelegramWebhookView, GetTelegramStartLinkView, TelegramMailBroadcastingView

urlpatterns = [
    path("webhook/", TelegramWebhookView.as_view(), name="telegram-webhook"),
    path("start-link/", GetTelegramStartLinkView.as_view(), name="telegram-start-link"),
    path("broadcasting/", TelegramMailBroadcastingView.as_view(), name='telegram-broadcasting'),
]
