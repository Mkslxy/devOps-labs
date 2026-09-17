from rest_framework import serializers

from apps.core.mixins import CreatedByMixin, FileLinkAttachmentsManagerMixin, FileAttachmentsManagerMixin
from apps.core.serializers.attachments_serializers import BaseFileSerializer, BaseLinkSerializers
from apps.core.serializers.ratable_serializers import BaseSubmissionRateSerializer
from apps.core.services import sync_file_attachments
from apps.courses.models import Course, CourseModule, CourseTopic, Material, MaterialFile, MaterialLink, Task, Subject, \
    TaskSubmissionFile, TaskFile, TaskLink, TaskSubmission, TaskAssignment
from apps.finance.models import SubscriptionPlan
from apps.gradebook.serializers import GradeSerializer
from apps.users.models import User
from apps.users.serializers import SimpleUserSerializer


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'
        read_only_fields = ['id', 'slug']


class SimpleCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = (
            'id',
            'title',
        )


class SubscriptionPlanMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'lessons_count',
            'duration_days', 'price', 'is_active'
        ]


class CourseSerializer(CreatedByMixin, serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(
        source='subject',
        queryset=Subject.objects.all(),
        write_only=True
    )

    subscription_plans = SubscriptionPlanMiniSerializer(many=True, read_only=True)

    created_by = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id',
            'title', 'description',
            'subject', 'subject_id',
            'price', 'level',
            'is_active',
            'created_by',
            'subscription_plans'
        ]
        read_only_fields = [
            'id', 'created_by'
        ]
        extra_kwargs = {
            'title': {'required': True},
            'description': {'required': True},
            'is_active': {'required': True},
        }


class SimpleCourseModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseModule
        fields = (
            'id',
            'title',
        )


class CourseModuleSerializer(CreatedByMixin, serializers.ModelSerializer):
    created_by = SimpleUserSerializer(read_only=True)
    course_data = SimpleCourseSerializer(read_only=True, source='course')

    class Meta:
        model = CourseModule
        fields = [
            'id',
            'title',
            'course', 'course_data',
            'created_by'
        ]
        read_only_fields = [
            'id', 'created_by'
        ]
        extra_kwargs = {
            'title': {'required': True},
        }


class CourseTopicSerializer(CreatedByMixin, serializers.ModelSerializer):
    created_by = SimpleUserSerializer(read_only=True)
    module_data = SimpleCourseModuleSerializer(read_only=True, source='module')

    class Meta:
        model = CourseTopic
        fields = [
            'id',
            'title', 'content_description',
            'module', 'module_data',
            'created_by'
        ]
        read_only_fields = [
            'id', 'created_by'
        ]
        extra_kwargs = {
            'title': {'required': True},
            'content_description': {'required': True},
        }


class MaterialFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialFile
        fields = ['id', 'file', 'name']


class MaterialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialLink
        fields = ['id', 'url', 'name', 'is_video_embed']


class MaterialSerializer(FileLinkAttachmentsManagerMixin, CreatedByMixin, serializers.ModelSerializer):
    attachment_file_model = MaterialFile
    attachment_link_model = MaterialLink

    files = MaterialFileSerializer(many=True, read_only=True)
    links = MaterialLinkSerializer(many=True, read_only=True)

    class Meta:
        model = Material
        fields = [
            'id',
            'topic',
            'title', 'description',
            'access_level',
            'files', 'links',
            'uploaded_files', 'deleted_file_ids',
            'links_json', 'deleted_link_ids',
            'created_at',
            'created_by'
        ]
        read_only_fields = [
            'id',
            'files', 'links',
            'created_at',
            'created_by'
        ]


### COURSE TASKS
class TaskFileSerializer(BaseFileSerializer):
    class Meta(BaseFileSerializer.Meta):
        model = TaskFile


class TaskSubmissionFileSerializer(BaseFileSerializer):
    class Meta(BaseFileSerializer.Meta):
        model = TaskSubmissionFile


class TaskLinkSerializer(BaseLinkSerializers):
    class Meta(BaseLinkSerializers.Meta):
        model = TaskLink


class TaskSerializer(FileLinkAttachmentsManagerMixin, CreatedByMixin, serializers.ModelSerializer):
    attachment_file_model = TaskFile
    attachment_link_model = TaskLink

    files = TaskFileSerializer(many=True, read_only=True)
    links = TaskLinkSerializer(many=True, read_only=True)

    topic = CourseTopicSerializer(read_only=True)

    topic_id = serializers.PrimaryKeyRelatedField(
        queryset=CourseTopic.objects.all(),
        source='topic',
        write_only=True,
        required=False
    )

    created_by = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Task
        fields = (
            'id',
            'title', 'description',
            'topic', 'topic_id',
            'files', 'links',
            'uploaded_files', 'deleted_file_ids',
            'links_json', 'deleted_link_ids',
            'created_at', 'updated_at', 'deadline',
            'created_by',
        )


class SimpleTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = (
            'id',
            'title',
            'description',
            'deadline',
        )


class TaskSubmissionSerializer(FileAttachmentsManagerMixin, serializers.ModelSerializer):
    files = TaskSubmissionFileSerializer(many=True, read_only=True)

    task = SimpleTaskSerializer(read_only=True)
    task_id = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.all(),
        source='task',
        write_only=True,
        required=True
    )

    student = SimpleUserSerializer(read_only=True)
    student_id = serializers.HiddenField(
        source='student',
        default=serializers.CurrentUserDefault()
    )

    grade = GradeSerializer(read_only=True)

    class Meta:
        model = TaskSubmission
        fields = (
            'id',
            'task', 'task_id',
            'student', 'student_id',
            'submission_text',
            'files',
            'uploaded_files', 'deleted_file_ids',
            'grade',
            'created_at', 'updated_at',
        )

    def validate(self, data):
        request = self.context.get('request')
        user: User = request.user

        if self.instance:
            task = self.instance.task
        else:
            task = data.get('task')

        assignment = TaskAssignment.objects.filter(
            task=task,
            group__groupstudent__student=user,
            group__groupstudent__status='active'
        ).first()

        if not assignment:
            raise serializers.ValidationError({
                "message": "You are not assigned to this task or you are not an active member of the group."
            })

        if task.is_deadline_passed:
            raise serializers.ValidationError({"deadline": "Homework is already past deadline"})

        if request.method == 'POST':
            if TaskSubmission.objects.filter(task=task, student=user).exists():
                raise serializers.ValidationError({"message": "You have already submitted this task."})

        edit_methods = ["PUT", "PATCH"]
        if request.method in edit_methods and self.instance.is_rated:
            raise serializers.ValidationError({"message": "Homework is already rated"})

        return data

    def create(self, validated_data):
        validated_data.pop('deleted_file_ids', None)
        uploaded_files = validated_data.pop('uploaded_files', [])

        task = super().create(validated_data)

        sync_file_attachments(
            document=task,
            file_model=TaskSubmissionFile,
            uploaded_files=uploaded_files,
            deleted_file_ids=[]
        )

        return task

    def update(self, instance, validated_data):
        deleted_file_ids = validated_data.pop('deleted_file_ids', None)
        uploaded_files = validated_data.pop('uploaded_files', [])

        instance = super().update(instance, validated_data)

        sync_file_attachments(
            document=instance,
            file_model=TaskSubmissionFile,
            uploaded_files=uploaded_files,
            deleted_file_ids=deleted_file_ids
        )

        return instance


class TaskReviewSerializer(serializers.ModelSerializer):
    files = TaskSubmissionFileSerializer(many=True, read_only=True)

    grade = GradeSerializer(read_only=True)

    task = SimpleTaskSerializer(read_only=True)
    student = SimpleUserSerializer(read_only=True)

    class Meta:
        model = TaskSubmission
        fields = (
            'id',
            'task',
            'student',
            'submission_text',
            'files',
            'grade',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'submission_text', 'created_at', 'task', 'student'
        )


class TaskSubmissionRateSerializer(BaseSubmissionRateSerializer):
    class Meta(BaseSubmissionRateSerializer.Meta):
        model = TaskSubmission
