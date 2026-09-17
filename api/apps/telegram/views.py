import asyncio
import json

import telebot
from django.http import HttpResponseForbidden, HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from UniSchool import settings
from apps.core.utils import HasPermission
from apps.telegram.services import bot, TelegramMessageBroadcastingService
from apps.telegram.serializers import TelegramLinkSerializer, TelegramBroadcastSerializer
from apps.telegram.services import TelegramAuthTokenService
from apps.telegram.utils import get_all_chats, get_chats_by_roles, get_chats_by_groups, get_chats_by_users, \
    get_chat_by_user, TelegramBroadcastValidator, BroadcastScopes


@extend_schema(tags=["Telegram"])
@method_decorator(csrf_exempt, name="dispatch")
class TelegramWebhookView(View):
    async def post(self, request, *args, **kwargs):
        secret_token = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
        if secret_token != settings.TG_SECRET:
            return HttpResponseForbidden('Invalid secret token')

        if request.method == 'POST':
            try:
                json_data = json.loads(request.body)
                update = telebot.types.Update.de_json(json_data)
                await bot.process_new_updates([update])

            except json.JSONDecodeError:
                return HttpResponse('Invalid JSON', status=400)

        return HttpResponse(status=200)


@extend_schema(
    tags=["Telegram"],
    responses={200: TelegramLinkSerializer}

)
class GetTelegramStartLinkView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user_id = request.user.id
        link = f"https://t.me/share/url?url=/activate%20{TelegramAuthTokenService.make_start_token(user_id)}"
        return Response({"link": link}, status=200)


@extend_schema(
    tags=["Telegram"],
    request=TelegramBroadcastSerializer
)
class TelegramMailBroadcastingView(APIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (FormParser, MultiPartParser)

    def post(self, request):
        serializer = TelegramBroadcastSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        req_user = request.user
        data = serializer.validated_data

        roles = data.get('roles', [])
        groups = data.get('groups', [])
        users = data.get('users', [])
        user = data.get('user')
        if roles:
            TelegramBroadcastValidator.validate_broadcast_scope(req_user, BroadcastScopes.ROLES, roles)
            chat_ids = get_chats_by_roles(roles_slugs=roles)
        elif groups:
            TelegramBroadcastValidator.validate_broadcast_scope(req_user, BroadcastScopes.GROUPS, groups)
            chat_ids = get_chats_by_groups(groups=groups)
        elif users:
            TelegramBroadcastValidator.validate_broadcast_scope(req_user, BroadcastScopes.USERS, users)
            chat_ids = get_chats_by_users(users=users)
        elif user:
            TelegramBroadcastValidator.validate_broadcast_scope(req_user, BroadcastScopes.USER, user)
            chat_ids = get_chat_by_user(user=user)
        else:
            TelegramBroadcastValidator.validate_broadcast_scope(req_user, BroadcastScopes.ALL)
            chat_ids = get_all_chats()

        chat_ids = list(set(chat_ids))

        asyncio.run(
            TelegramMessageBroadcastingService.send_telegram_broadcast(
                chat_ids=chat_ids,
                message=serializer.validated_data.get("message"),
                files=serializer.validated_data.get("files", [])
            )
        )

        return Response({"ok": True})
