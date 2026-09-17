from rest_framework import serializers


class GoogleAuthSerializer(serializers.Serializer):
    code = serializers.CharField(required=True)


class GoogleCallbackSerializer(serializers.Serializer):
    code = serializers.CharField(
        required=True,
        help_text="Authorization code from Google (from redirect URL params)"
    )
