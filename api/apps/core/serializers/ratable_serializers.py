from rest_framework import serializers

from apps.core.mixins import FileAttachmentsManagerMixin
from apps.gradebook.serializers import GradeSerializer, GradeFileSerializer


class BaseSubmissionRateSerializer(FileAttachmentsManagerMixin, serializers.ModelSerializer):
    grade = GradeSerializer(read_only=True)

    files = GradeFileSerializer(many=True, read_only=True)

    value = serializers.FloatField(write_only=True)
    comment = serializers.CharField(write_only=True, required=False)

    class Meta:
        abstract = True
        fields = (
            'id',
            'grade',
            'value', 'comment',
            'files',
            'uploaded_files', 'deleted_file_ids'
        )
