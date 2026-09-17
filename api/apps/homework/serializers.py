from rest_framework import serializers
from rest_framework.relations import PrimaryKeyRelatedField
from rest_framework.serializers import ModelSerializer

from apps.classes.serializers import LessonSerializer, SimpleGroupSerializer
from apps.core.mixins import CreatedByMixin, FileAttachmentsManagerMixin, FileLinkAttachmentsManagerMixin
from apps.core.serializers.attachments_serializers import BaseFileSerializer, BaseLinkSerializers
from apps.core.serializers.ratable_serializers import BaseSubmissionRateSerializer
from apps.core.services import sync_file_attachments
from apps.classes.models import Lesson, Group
from apps.gradebook.serializers import GradeSerializer
from apps.homework.models import Homework, HomeworkSubmission
from apps.homework.models.homework_file import HomeworkFile
from apps.homework.models.homework_link import HomeworkLink
from apps.homework.models.homework_submission_file import HomeworkSubmissionFile
from apps.gradebook.services import create_homework_column
from apps.users.models import User
from apps.users.serializers import SimpleUserSerializer


class HomeworkFileSerializer(BaseFileSerializer):
    class Meta(BaseFileSerializer.Meta):
        model = HomeworkFile


class HomeworkSubmissionFileSerializer(BaseFileSerializer):
    class Meta(BaseFileSerializer.Meta):
        model = HomeworkSubmissionFile


class HomeworkLinkSerializer(BaseLinkSerializers):
    class Meta(BaseLinkSerializers.Meta):
        model = HomeworkLink


class HomeworkSerializer(FileLinkAttachmentsManagerMixin, CreatedByMixin, serializers.ModelSerializer):
    attachment_file_model = HomeworkFile
    attachment_link_model = HomeworkLink

    files = HomeworkFileSerializer(many=True, read_only=True)
    links = HomeworkLinkSerializer(many=True, read_only=True)

    lesson = LessonSerializer(read_only=True)
    student = SimpleUserSerializer(read_only=True)
    group = SimpleGroupSerializer(read_only=True)

    lesson_id = serializers.PrimaryKeyRelatedField(
        queryset=Lesson.objects.all(),
        source='lesson',
        write_only=True,
        required=False,
        allow_null=True
    )
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='student',
        write_only=True,
        required=False,
        allow_null=True
    )
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        source='group',
        write_only=True,
        required=False,
        allow_null=True
    )

    created_by = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Homework
        fields = (
            'id',
            'title',
            'description',
            'deadline',
            'lesson_id', 'lesson',
            'student_id', 'student',
            'group_id', 'group',
            'files', 'links',
            'uploaded_files', 'deleted_file_ids',
            'links_json', 'deleted_link_ids',
            'created_at', 'updated_at',
            'created_by',
        )

    def perform_pre_save(self, validated_data):
        column = create_homework_column(validated_data)
        validated_data['grade_column'] = column


class SimpleHomeworkSerializer(ModelSerializer):
    class Meta:
        model = Homework
        fields = (
            'id',
            'title',
            'description',
            'deadline',
        )


class HomeworkSubmissionSerializer(FileAttachmentsManagerMixin, serializers.ModelSerializer):
    files = HomeworkSubmissionFileSerializer(many=True, read_only=True)

    homework = SimpleHomeworkSerializer(read_only=True)
    homework_id = PrimaryKeyRelatedField(
        queryset=Homework.objects.all(),
        source="homework",
        write_only=True,
        required=True,
    )

    student = SimpleUserSerializer(read_only=True)
    student_id = serializers.HiddenField(
        source='student',
        default=serializers.CurrentUserDefault()
    )

    grade = GradeSerializer(read_only=True)

    class Meta:
        model = HomeworkSubmission
        fields = (
            'id',
            'homework', 'homework_id',
            'student', 'student_id',
            'submission_text',
            'files',
            'uploaded_files', 'deleted_file_ids',
            'grade',
            'created_at', 'updated_at',
        )

    def validate(self, data):
        request = self.context.get('request')
        homework = data.get('homework') or (self.instance.homework if self.instance else None)

        if homework.is_deadline_passed:
            raise serializers.ValidationError({"deadline": "Homework is already past deadline"})

        lesson = homework.lesson
        lesson_people = list(lesson.group.custom_user_set.all()) if lesson else []
        group_people = list(homework.group.custom_user_set.all()) if homework.group else []
        student = homework.student

        allowed_people = lesson_people + group_people + [student]
        user = request.user
        if user not in allowed_people:
            raise serializers.ValidationError({"message": "You are not allowed to submit this homework"})

        if (request.method == 'POST' and
            HomeworkSubmission.objects.filter(homework=homework.id, student=user.id).exists()):
            raise serializers.ValidationError({"message": "You are not allowed to submit this homework more than once"})

        edit_methods = ["PUT", "PATCH"]
        if (request.method in edit_methods and
            self.instance.is_rated):
            raise serializers.ValidationError({"message": "Homework is already rated"})

        return data

    def create(self, validated_data):
        validated_data.pop('deleted_file_ids', None)
        uploaded_files = validated_data.pop('uploaded_files', [])

        homework = super().create(validated_data)

        sync_file_attachments(
            document=homework,
            file_model=HomeworkSubmissionFile,
            uploaded_files=uploaded_files,
            deleted_file_ids=[]
        )

        return homework

    def update(self, instance, validated_data):
        deleted_file_ids = validated_data.pop('deleted_file_ids', None)
        uploaded_files = validated_data.pop('uploaded_files', [])

        instance = super().update(instance, validated_data)

        sync_file_attachments(
            document=instance,
            file_model=HomeworkSubmissionFile,
            uploaded_files=uploaded_files,
            deleted_file_ids=deleted_file_ids
        )

        return instance


class HomeworkReviewSerializer(serializers.ModelSerializer):
    files = HomeworkSubmissionFileSerializer(many=True, read_only=True)

    grade = GradeSerializer(read_only=True)

    homework = SimpleHomeworkSerializer(read_only=True)
    student = SimpleUserSerializer(read_only=True)

    class Meta:
        model = HomeworkSubmission
        fields = (
            'id',
            'homework',
            'student',
            'submission_text',
            'files',
            'grade',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'submission_text', 'created_at'
        )


class HomeworkSubmissionRateSerializer(BaseSubmissionRateSerializer):
    class Meta(BaseSubmissionRateSerializer.Meta):
        model = HomeworkSubmission
