from django.core.validators import FileExtensionValidator
from rest_framework import serializers


class TestMagicImportSerializer(serializers.Serializer):
    photo = serializers.ImageField(required=True)


class CourseMagicImportSerializer(serializers.Serializer):
    file = serializers.FileField(
        required=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'txt'])]
    )
