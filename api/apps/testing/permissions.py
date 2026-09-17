from rest_framework import permissions


class IsNotStudent(permissions.BasePermission):
    message = "Student cannot access this resource."

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        is_student = request.user.role.slug == 'student'
        return not is_student
