from enum import Enum
from io import BytesIO
from typing import List

from django.contrib.contenttypes.models import ContentType
from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied

from apps.classes.models import Group
from apps.telegram.models import TelegramConnection
from apps.telegram.models.notification_log import NotificationLog, NotificationType
from apps.users.models import User


def get_all_chats():
    return list(TelegramConnection.objects
                .filter(is_active=True)
                .values_list('tg_id', flat=True))


def get_chats_by_roles(roles_slugs: List[str]):
    return list(TelegramConnection.objects
                .filter(user__role__slug__in=roles_slugs, is_active=True)
                .values_list('tg_id', flat=True))


def get_chats_by_groups(groups):
    return list(TelegramConnection.objects
                .filter(Q(user__groups__in=groups) | Q(user__teaching_groups__in=groups), is_active=True)
                .distinct()
                .values_list('tg_id', flat=True))


def get_chats_by_users(users):
    return list(TelegramConnection.objects
                .filter(user__in=users, is_active=True)
                .values_list('tg_id', flat=True))


def get_chat_by_user(user):
    return list(TelegramConnection.objects
                .filter(user=user, is_active=True)
                .values_list('tg_id', flat=True))


###
### VALIDATORS
###
class BroadcastScopes(str, Enum):
    ALL = 'all'
    ROLES = 'roles'
    GROUPS = 'groups'
    USERS = 'users'
    USER = 'user'


class TelegramBroadcastValidator:

    @classmethod
    def _validate_groups(cls, req_user, groups):
        group_ids = [g.id for g in groups]
        invalid_exists = Group.objects.filter(id__in=group_ids).exclude(teacher=req_user).exists()
        if invalid_exists:
            raise PermissionDenied("You can broadcast only to your own groups.")

    @classmethod
    def _validate_users(cls, req_user, users):
        user_ids = [u.id for u in users]
        invalid_exists = User.objects.filter(id__in=user_ids).exclude(groups__teacher=req_user).exists()
        if invalid_exists:
            raise PermissionDenied("You can broadcast only to your own students.")

    @classmethod
    def _validate_user(cls, req_user, user):
        is_allowed = User.objects.filter(
            id=user.id,
            groups__teacher=req_user
        ).exists()
        if not is_allowed:
            raise PermissionDenied("You can broadcast only to your own students.")

    @classmethod
    def validate_broadcast_scope(cls, req_user, scope: BroadcastScopes, objs=None):
        if req_user.has_permission('telegram.broadcast'):
            return

        if not req_user.has_permission('telegram.broadcast_own_groups'):
            raise PermissionDenied("You have no permission to broadcast.")

        if scope == BroadcastScopes.GROUPS:
            cls._validate_groups(req_user, objs)
        elif scope == BroadcastScopes.USERS:
            cls._validate_users(req_user, objs)
        elif scope == BroadcastScopes.USER:
            cls._validate_user(req_user, objs)
        else:
            raise PermissionDenied(
                "You have no permission to broadcast to this scope or you passed a group/user that does not belong to you."
            )


def uploaded_file_to_bytes(photo):
    photo.file.seek(0)
    data = photo.file.read()

    bio = BytesIO(data)
    bio.name = photo.name
    return bio


def create_notification_log(obj, type_):
    content_type = ContentType.objects.get_for_model(obj)

    try:
        return NotificationLog.objects.create(
            content_type=content_type,
            object_id=obj.id,
            type=type_,
        )
    except IntegrityError:
        return None


def create_notification_logs_bulk(objs, type_):
    if not objs:
        return False

    first_obj = objs[0]
    content_type = ContentType.objects.get_for_model(first_obj)

    logs_to_create = [
        NotificationLog(
            content_type=content_type,
            object_id=obj.id,
            type=type_
        ) for obj in objs
    ]

    try:
        with transaction.atomic():
            NotificationLog.objects.bulk_create(
                logs_to_create,
                ignore_conflicts=True
            )
        return True
    except Exception as e:
        return False


def delete_notifications_log_by_obj_id(obj_id, class_):
    content_type = ContentType.objects.get_for_model(class_)
    NotificationLog.objects.filter(
        content_type=content_type,
        object_id=obj_id
    ).delete()
