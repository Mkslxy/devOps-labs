import logging
logger = logging.getLogger(__name__)

import asyncio
import base64
import hashlib
import hmac
import time

import requests
from asgiref.sync import sync_to_async
from telebot.apihelper import ApiException
from telebot.async_telebot import AsyncTeleBot
from telebot.types import InputMediaPhoto, InputMediaVideo, InputMediaDocument

from UniSchool import settings
from apps.telegram.models.telegram_connection import TelegramConnection
from apps.telegram.utils import uploaded_file_to_bytes

SECRET = settings.TG_SECRET
SIGN_LEN = 12
EXPIRES_SECONDS = 60 * 60

token = settings.TG_TOKEN
bot = AsyncTeleBot(token)


@bot.message_handler(commands=['start'])
async def start_handler(message):
    await bot.send_message(
        message.chat.id,
        "👋 Вітаю!",
    )


@bot.message_handler(commands=['activate'])
async def activate_handler(message):
    parts = message.text.split(" ", 1)
    token = parts[1] if len(parts) > 1 else None

    if not token:
        return

    data = TelegramAuthTokenService.verify_start_token(token)
    if data:
        tg_user_id = message.from_user.id
        ref_user_id = data["ref_user_id"]

        await sync_to_async(TelegramConnection.objects.update_or_create)(
            tg_id=tg_user_id,
            defaults={
                "user_id": ref_user_id,
                "is_active": True
            }
        )

        await bot.send_message(
            message.chat.id,
            "🛎 <b>Ви успішно прив'язали ваш акаунт!</b>\nВідв'язати – /deactivate",
            parse_mode="HTML"
        )
    else:
        await bot.send_message(
            message.chat.id,
            "⚠️ <b>Помилка при підключенні: Неправильний код!</b>",
            parse_mode="HTML"
        )


@bot.message_handler(commands=['deactivate'])
async def deactivate_handler(message):
    tg_user_id = message.from_user.id

    connection = await sync_to_async(lambda: TelegramConnection.objects.filter(tg_id=tg_user_id, ).first())()

    if not connection:
        await bot.send_message(
            message.chat.id,
            "🛎 <b>Ви не прив'язані!</b>",
            parse_mode="HTML"
        )
        return

    connection.is_active = False
    await sync_to_async(connection.save)()

    await bot.send_message(
        message.chat.id,
        "✅ <b>Відв'язав вас від сповіщень!</b>",
        parse_mode="HTML"
    )


class TelegramMessageBroadcastingService:
    MAX_MEDIA = 5
    MAX_RETRIES = 3

    @staticmethod
    def _build_media(file_bytes, content_type, caption=None):
        if content_type.startswith("image/"):
            return InputMediaPhoto(file_bytes, caption=caption, parse_mode="HTML")
        if content_type.startswith("video/"):
            return InputMediaVideo(file_bytes, caption=caption, parse_mode="HTML")
        return InputMediaDocument(file_bytes, caption=caption, parse_mode="HTML")

    @staticmethod
    async def send_to_chat(chat_id, message=None, files=None):
        if message and not files:
            await bot.send_message(chat_id, message, parse_mode="HTML")
            return

        media_bytes = [
            (uploaded_file_to_bytes(f), f.content_type)
            for f in files
        ]

        batches = [
            media_bytes[i:i + TelegramMessageBroadcastingService.MAX_MEDIA]
            for i in range(0, len(media_bytes), TelegramMessageBroadcastingService.MAX_MEDIA)
        ]

        for batch_index, batch in enumerate(batches):
            is_last_batch = batch_index == len(batches) - 1
            media_group = []

            for media_index, (bio, content_type) in enumerate(batch):
                is_last_media = is_last_batch and media_index == len(batch) - 1

                media_group.append(
                    TelegramMessageBroadcastingService._build_media(
                        bio,
                        content_type,
                        caption=message if is_last_media else None
                    )
                )

            await bot.send_media_group(chat_id, media_group, timeout=300)
            await asyncio.sleep(0.5)

    @staticmethod
    async def send_telegram_broadcast(chat_ids, message=None, files=None):
        for chat_id in chat_ids:
            for attempt in range(TelegramMessageBroadcastingService.MAX_RETRIES):
                try:
                    await TelegramMessageBroadcastingService.send_to_chat(
                        chat_id,
                        message=message,
                        files=files
                    )
                    break

                except ApiException as e:
                    if e.error_code == 429:
                        retry_after = getattr(e, "parameters", {}).get("retry_after", 3)
                        await asyncio.sleep(retry_after + 1)
                    else:
                        raise

    @staticmethod
    def send_to_chat_sync(chat_id, text):
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True
        }
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()

    @staticmethod
    def send_telegram_broadcast_sync(chat_ids, text):
        for chat_id in chat_ids:
            for attempt in range(TelegramMessageBroadcastingService.MAX_RETRIES):
                try:
                    TelegramMessageBroadcastingService.send_to_chat_sync(chat_id, text)
                    break

                except requests.exceptions.HTTPError as e:
                    status_code = e.response.status_code if e.response is not None else None
                    if not status_code:
                        break

                    if status_code == 429:
                        json_res = e.response.json()
                        retry_after = json_res.get("parameters", {}).get("retry_after", 3)
                        time.sleep(retry_after + 1)
                        continue
                    elif status_code in [400, 403]:
                        logger.error(f"Telegram Error {status_code} for {chat_id}: {e}")
                        break



class TelegramAuthTokenService:
    @staticmethod
    def make_start_token(ref_user_id: int, secret: str = SECRET, expires_in: int = EXPIRES_SECONDS) -> str:
        exp = int(time.time()) + expires_in
        payload = f"{ref_user_id}:{exp}".encode()
        b64 = base64.urlsafe_b64encode(payload).rstrip(b"=").decode()
        sig = hmac.new(secret.encode(), b64.encode(), hashlib.sha256).hexdigest()[:SIGN_LEN]
        token = f"{b64}.{sig}"
        return token

    @staticmethod
    def verify_start_token(token: str, secret: str = SECRET):
        try:
            b64, sig = token.split(".", 1)
        except ValueError:
            return None

        expected = hmac.new(secret.encode(), b64.encode(), hashlib.sha256).hexdigest()[:SIGN_LEN]
        if not hmac.compare_digest(expected, sig):
            return None

        padding = "=" * (-len(b64) % 4)
        try:
            payload = base64.urlsafe_b64decode(b64 + padding).decode()
            ref_id_str, exp_str = payload.split(":", 1)
            ref_user_id = int(ref_id_str)
            exp = int(exp_str)
        except Exception:
            return None

        if exp < int(time.time()):
            return None

        return {"ref_user_id": ref_user_id, "exp": exp}


def get_media_type(file):
    ct = getattr(file, "content_type", "") or ""
    if ct.startswith("image/"):
        return "photo"
    if ct.startswith("video/"):
        return "video"
    return "document"

