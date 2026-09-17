from rest_framework import serializers

from apps.classes.models import Group
from apps.users.models import Role, User


class TelegramLinkSerializer(serializers.Serializer):
    link = serializers.CharField(read_only=True)


class TelegramBroadcastSerializer(serializers.Serializer):
    message = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Message text (HTML)"
    )

    files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True,
        help_text="Images / Videos / Documents (max 10)"
    )

    roles = serializers.ListField(
        child=serializers.ChoiceField(choices=[]),
        required=False,
        allow_empty=True,
        help_text="Send to roles"
    )

    groups = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(
            queryset=Group.objects.all()
        ),
        required=False,
        allow_empty=True,
        help_text="Send to groups"
    )

    users = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(
            queryset=User.objects.all()
        ),
        required=False,
        allow_empty=True,
        help_text="Send to users"
    )

    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_empty=True,
        help_text="Send to specific user"
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["roles"].child.choices = [(slug, slug) for slug in Role.objects.values_list("slug", flat=True)]

    def validate_files(self, files):
        if len(files) > 10:
            raise serializers.ValidationError("Maximum 10 files allowed")

        allowed_types = (
            "image/",
            "video/",
            "application/pdf",
            "application/msword",
            "application/vnd"
        )

        for f in files:
            if not any(f.content_type.startswith(t) for t in allowed_types):
                raise serializers.ValidationError(
                    f"Unsupported file type: {f.content_type}"
                )

        return files

    def validate(self, data):
        message = data.get("message")
        files = data.get("files", [])

        roles = data.get("roles", [])
        groups = data.get("groups", [])
        users = data.get("users", [])
        user = data.get("user", [])

        if sum([bool(roles), bool(groups), bool(users), bool(user)]) > 1:
            raise serializers.ValidationError({'message': "Only one filter allowed: roles OR groups OR users OR user."})

        if not message and not files:
            raise serializers.ValidationError(
                "Message or files are required"
            )

        return data
