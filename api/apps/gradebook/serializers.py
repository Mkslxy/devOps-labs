from rest_framework import serializers
from rest_framework.fields import ListField
from rest_framework.relations import PrimaryKeyRelatedField

from apps.classes.models import GroupStudent
from apps.classes.models.group_student import GroupStudentStatus
from apps.classes.serializers import GroupSerializer
from apps.core.mixins import CreatedByMixin, FileAttachmentsManagerMixin
from apps.core.services import sync_file_attachments
from apps.gradebook.models import Grade, Attendance, GradeCategory
from apps.gradebook.models.attendence import AttendanceCategory
from apps.gradebook.models.grade_column import GradeColumn
from apps.gradebook.models.grade_file import GradeFile
from apps.gradebook.utils import is_student_in_column, get_first_day_of_month, get_last_day_of_month
from apps.users.models import User
from apps.users.serializers import SimpleUserSerializer


class GradeFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeFile
        fields = ['id', 'file', 'name']


class GradeSerializer(CreatedByMixin, serializers.ModelSerializer):
    files = GradeFileSerializer(many=True, read_only=True)
    category = serializers.ChoiceField(choices=GradeCategory.choices)
    created_by = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Grade
        fields = (
            'id',
            'category',
            'value', 'comment',
            'student', 'column',
            'files',
            'created_at',
            'created_by'
        )


class GradeViewSerializer(FileAttachmentsManagerMixin, CreatedByMixin, serializers.ModelSerializer):
    files = GradeFileSerializer(many=True, read_only=True)

    category = serializers.ChoiceField(choices=GradeCategory.choices)

    created_by = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Grade
        fields = (
            'id',
            'category',
            'value', 'comment',
            'student', 'column',
            'files',
            'uploaded_files', 'deleted_file_ids',
            'created_at',
            'created_by'
        )
        extra_kwargs = {
            'column': {'required': True}
        }

    def validate(self, data):
        instance = self.instance

        student = data.get('student')
        if not student and instance:
            student = instance.student

        column = data.get('column')
        if not column and instance:
            column = instance.column

        if student and column:
            if not is_student_in_column(student, column):
                raise serializers.ValidationError({
                    "student": "Student is not an active member of the column's group."
                })

        return data

    def create(self, validated_data):
        validated_data.pop('deleted_file_ids', None)
        uploaded_files = validated_data.pop('uploaded_files', [])

        grade = super().create(validated_data)

        sync_file_attachments(
            document=grade,
            file_model=GradeFile,
            uploaded_files=uploaded_files,
            deleted_file_ids=[]
        )

        return grade

    def update(self, instance, validated_data):
        deleted_file_ids = validated_data.pop('deleted_file_ids', None)
        uploaded_files = validated_data.pop('uploaded_files', [])

        instance = super().update(instance, validated_data)

        sync_file_attachments(
            document=instance,
            file_model=GradeFile,
            uploaded_files=uploaded_files,
            deleted_file_ids=deleted_file_ids
        )

        return instance


class AttendanceSerializer(CreatedByMixin, serializers.ModelSerializer):
    category = serializers.ChoiceField(choices=AttendanceCategory.choices)
    created_by = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Attendance
        fields = (
            'id',
            'column',
            'student',
            'category',
            'late_minutes',
            'comment',
            'created_at',
            'created_by'
        )
        extra_kwargs = {
            'column': {'required': True}
        }

    def validate(self, data):
        instance = self.instance

        student = data.get('student') or (instance and instance.student)
        column = data.get('column') or (instance and instance.column)
        if student and column:
            if not is_student_in_column(student, column):
                raise serializers.ValidationError({
                    "student": "Student is not an active member of the column's group."
                })

        category = data.get('category') or (instance and instance.category)
        if category != AttendanceCategory.LATE:
            data['late_minutes'] = 0

        return data


class AttendanceBatchSerializer(serializers.ModelSerializer):
    students = ListField(
        child=PrimaryKeyRelatedField(queryset=User.objects.all()),
        write_only=True,
        required=True
    )

    class Meta:
        model = Attendance
        fields = (
            'column',
            'category',
            'students'
        )
        extra_kwargs = {
            'column': {'required': True}
        }

    def validate(self, data):
        students = data.get('students')
        column = data.get('column')

        student_ids = [s.id for s in students]

        valid_students_count = GroupStudent.objects.filter(
            group=column.group,
            student_id__in=student_ids,
            status=GroupStudentStatus.ACTIVE
        ).count()

        if valid_students_count != len(students):
            raise serializers.ValidationError({
                "students": "One or more students are not active members of this group."
            })

        return data


class GradeColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeColumn
        fields = (
            'id',
            'title',
            'comment',
            'group',
            'date'
        )


class GradeColumnRetrieveSerializer(serializers.ModelSerializer):
    group = GroupSerializer(read_only=True)
    grades = GradeSerializer(many=True, read_only=True)
    attendance = AttendanceSerializer(many=True, read_only=True)

    class Meta:
        model = GradeColumn
        fields = (
            'id',
            'title',
            'comment',
            'group',
            'grades', 'attendance',
            'date'
        )


class GradeColumnBatchSerializer(serializers.ModelSerializer):
    dates = serializers.ListField(
        child=serializers.DateField(),
        write_only=True,
        required=True
    )

    class Meta:
        model = GradeColumn
        fields = (
            'title',
            'group',
            'dates'
        )


class GradebookFilterSerializer(serializers.Serializer):
    group_id = serializers.IntegerField(required=True)
    start_date = serializers.DateField(
        required=False,
        default=get_first_day_of_month
    )
    end_date = serializers.DateField(
        required=False,
        default=get_last_day_of_month
    )

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date cannot be after end date.")
        return data
