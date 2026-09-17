from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import BasePermission
from drf_spectacular.extensions import OpenApiFilterExtension

from apps.users.models import User


class HasPermission(BasePermission):
    message = "You don't have permission to perform this action."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        admin_perms = getattr(view, 'admin_permissions', [])
        if admin_perms and self._has_any_permission(user, request, admin_perms):
            return True

        if hasattr(view, 'get_required_permissions'):
            required = view.get_required_permissions(request)
        else:
            required = getattr(view, "required_permissions", [])

        if not required:
            return True

        return self._has_all_permissions(user, request, required)

    def _get_cached_permissions(self, user, request):
        if not hasattr(request, '_cached_permission_slugs'):
            if hasattr(user, 'role') and hasattr(user.role, 'permissions'):
                request._cached_permission_slugs = {
                    perm.slug for perm in user.role.permissions.all()
                }
            else:
                request._cached_permission_slugs = set()

        return request._cached_permission_slugs

    def _has_all_permissions(self, user, request, perms):
        cached = self._get_cached_permissions(user, request)
        return all(p in cached for p in perms)

    def _has_any_permission(self, user, request, perms):
        cached = self._get_cached_permissions(user, request)
        return any(p in cached for p in perms)


class IsOwnerOrHasCustomPermission(BasePermission):
    """
    Дозволяє дію, якщо:
    1. Юзер є 'created_by' об'єкта.
    2. Юзер є 'teacher' об'єкта (специфічно для Lessons/Groups).
    3. Юзер має суперправа (admin_permissions).
    """
    message = "You don't have permission to touch this object."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if isinstance(obj, User) and obj == user:
            return True

        if getattr(obj, "created_by_id", None) == user.id:
            return True

        if getattr(obj, "teacher_id", None) == user.id:
            return True

        admin_perms = getattr(view, 'admin_permissions', [])

        if not admin_perms:
            return False

        return any(user.has_permission(perm) for perm in admin_perms)


class CustomPageNumberPagination(PageNumberPagination):
    page_size_query_param = "page_size"
    max_page_size = 50


class EnumOrderingFilterExtension(OpenApiFilterExtension):
    target_class = 'rest_framework.filters.OrderingFilter'
    priority = 1

    def get_schema_operation_parameters(self, auto_schema, *args, **kwargs):
        view = auto_schema.view
        ordering_fields = getattr(view, 'ordering_fields', [])

        if not ordering_fields:
            return []

        enums = []
        for field in ordering_fields:
            if isinstance(field, (list, tuple)):
                field = field[0]

            enums.append(str(field))
            enums.append(f"-{str(field)}")

        return [{
            'name': 'ordering',
            'in': 'query',
            'required': False,
            'description': 'Which field to use when ordering the results.',
            'schema': {
                'type': 'string',
                'enum': enums
            }
        }]


def get_connections_count(*args):
    return sum([bool(v) for v in args])
