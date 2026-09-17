from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from apps.classes.models import Group, Lesson, LessonType, GroupStudent, School, Task, InternalMeeting, MeetingType
from apps.classes.models.group_student import GroupStudentStatus
from apps.classes.models.lesson import LessonStatus
from apps.classes.utils import StrictDateTimeField
from apps.core.mixins import CreatedByMixin
from apps.courses.models import Course
from apps.gradebook.models import Grade
from apps.users.models import User
from apps.users.serializers import UserSerializer, SimpleUserSerializer


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'


class GroupSerializer(CreatedByMixin, serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    course = serializers.SerializerMethodField()
    school = SchoolSerializer(read_only=True)

    teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__slug='teacher'),
        source='teacher',
        write_only=True,
        required=False,
        allow_null=True
    )
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        source='course',
        write_only=True,
        required=False,
        allow_null=True
    )
    school_id = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(),
        source='school',
        write_only=True,
        required=False,
        allow_null=True
    )

    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    students = SimpleUserSerializer(source='custom_user_set', many=True, read_only=True)

    class Meta:
        model = Group
        fields = [
            'id',
            'name', 'status',
            'age_group', 'knowledge_level',
            'teacher_id', 'course_id', 'school_id',
            'teacher', 'course', 'school',
            'students', 'student_ids',
            'created_at', 'updated_at',
            'is_online',
            'created_by'
        ]
        read_only_fields = [
            'id', 'created_by'
        ]

    def get_course(self, obj):
        if not obj.course:
            return None

        from apps.courses.serializers import CourseSerializer
        return CourseSerializer(obj.course, read_only=True).data

    def validate(self, data):
        instance = self.instance
        teacher = data.get('teacher', getattr(instance, 'teacher', None))
        school = data.get('school', getattr(instance, 'school', None))

        if teacher and school and school not in teacher.schools.all():
            raise ValidationError({"teacher_id": "Teacher should be affiliated to the group's school."})

        student_ids = data.get('student_ids', [])
        if school and student_ids:
            invalid_students = User.objects.filter(
                id__in=student_ids
            ).exclude(schools=school)
            if invalid_students.exists():
                raise ValidationError({"student_ids": "Some students are not in the group's school."})

        return data

    def create(self, validated_data):
        student_ids = validated_data.pop('student_ids', [])
        group = super().create(validated_data)

        if student_ids:
            students = User.objects.filter(id__in=student_ids)
            group.custom_user_set.set(students)

        return group

    def update(self, instance, validated_data):
        student_ids = validated_data.pop('student_ids', None)
        instance = super().update(instance, validated_data)

        if student_ids is not None:
            students = User.objects.filter(id__in=student_ids)
            instance.custom_user_set.set(students)

        return instance


class SimpleGroupSerializer(serializers.ModelSerializer):
    students = SimpleUserSerializer(source='custom_user_set', many=True, read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'status', 'age_group', 'knowledge_level', 'teacher', 'students', 'is_online']
        read_only_fields = fields


class LessonTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonType
        fields = [
            'id',
            'name', 'slug',
            'duration_minutes'
        ]
        read_only_fields = fields


class LessonSerializer(CreatedByMixin, serializers.ModelSerializer):
    teacher = SimpleUserSerializer(read_only=True)
    teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__slug='teacher'),
        source='teacher',
        write_only=True
    )

    group = SimpleGroupSerializer(read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        source='group',
        write_only=True
    )

    lesson_type = LessonTypeSerializer(read_only=True)
    lesson_type_id = serializers.PrimaryKeyRelatedField(
        queryset=LessonType.objects.all(),
        source='lesson_type',
        write_only=True,
        required=True
    )

    start_time = StrictDateTimeField(
        input_formats=['iso-8601'],
        required=True
    )

    color_hex = serializers.SerializerMethodField()

    plan_status = serializers.CharField(read_only=True)
    plan_feedback = serializers.CharField(read_only=True)

    class Meta:
        model = Lesson
        fields = [
            'id',
            'topic', 'description',
            'start_time', 'end_time',
            'lesson_type', 'lesson_type_id',
            'group', 'group_id',
            'teacher', 'teacher_id',
            'color_id', 'color_hex',
            'meet_link', 'html_link', 'status', 'lesson_plan',
            'created_by', 'created_at',
            'is_online', 'plan_status', 'plan_feedback',
        ]
        read_only_fields = [
            'id', 'created_by', 'meet_link', 'html_link', 'created_at', 'end_time'
        ]

    def validate(self, data):
        start = data.get('start_time')
        lesson_type = data.get('lesson_type')

        if self.instance:
            start = start or self.instance.start_time
            lesson_type = lesson_type or self.instance.lesson_type

        if 'start_time' in data:
            if start < timezone.now():
                raise serializers.ValidationError({
                    "start_time": "Cannot set start time in the past."
                })

        if start and lesson_type:
            data['end_time'] = start + timedelta(minutes=lesson_type.duration_minutes)

        return data

    def get_color_hex(self, obj):
        return obj.get_color_id_display()


class SimpleLessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = (
            'id',
            'topic', 'description',
        )


class InternalMeetingSerializer(CreatedByMixin, serializers.ModelSerializer):
    created_by = SimpleUserSerializer(read_only=True)

    attendees = SimpleUserSerializer(many=True, read_only=True)
    attendee_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        source='attendees',
        many=True,
        write_only=True,
        required=False
    )

    start_time = StrictDateTimeField(input_formats=['iso-8601'], required=True)
    end_time = StrictDateTimeField(input_formats=['iso-8601'], required=True)

    color_hex = serializers.SerializerMethodField()

    class Meta:
        model = InternalMeeting
        fields = [
            'id', 'title', 'description', 'type',
            'attendees', 'attendee_ids',
            'start_time', 'end_time',
            'color_id', 'color_hex',
            'meet_link', 'html_link', 'is_online',
            'created_by', 'created_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'meet_link', 'html_link', 'created_at', 'type']

    def validate(self, data):
        start = data.get('start_time', getattr(self.instance, 'start_time', None))
        end = data.get('end_time', getattr(self.instance, 'end_time', None))

        if 'start_time' in data and start < timezone.now():
            raise serializers.ValidationError({
                "start_time": "Cannot set start time in the past."
            })

        if start and end and end <= start:
            raise serializers.ValidationError({
                "end_time": "End time must be strictly after start time."
            })

        return data

    def get_color_hex(self, obj):
        return obj.get_color_id_display()


class TrainingSerializer(InternalMeetingSerializer):
    class Meta(InternalMeetingSerializer.Meta):
        pass

    def validate(self, data):
        data['type'] = MeetingType.TRAINING
        return super().validate(data)


class StaffMeetingSerializer(InternalMeetingSerializer):
    class Meta(InternalMeetingSerializer.Meta):
        pass

    def validate(self, data):
        data['type'] = MeetingType.STAFF_MEETING
        return super().validate(data)


class WeeklyScheduleSerializer(serializers.Serializer):
    day_of_week = serializers.IntegerField(min_value=0, max_value=6, help_text="0=Mon, 6=Sun")
    time = serializers.TimeField(format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'])

    # Overrides (перекриття налаштувань)
    lesson_type_id = serializers.IntegerField(required=False)
    is_online = serializers.BooleanField(required=False)


class RecurringLessonSerializer(serializers.Serializer):
    group_id = serializers.IntegerField()
    teacher_id = serializers.IntegerField()
    lesson_type_id = serializers.IntegerField(required=False)

    topic = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    color_id = serializers.CharField(required=False, default="3")
    is_online = serializers.BooleanField(default=False)

    start_date = serializers.DateField()
    end_date = serializers.DateField()

    schedule = WeeklyScheduleSerializer(many=True, allow_empty=False)

    def validate(self, data):
        if data['end_date'] < data['start_date']:
            raise serializers.ValidationError("Дата закінчення не може бути раніше початку.")

        needed_type_ids = set()
        if 'lesson_type_id' in data:
            needed_type_ids.add(data['lesson_type_id'])

        for item in data['schedule']:
            if 'lesson_type_id' in item:
                needed_type_ids.add(item['lesson_type_id'])

        if not needed_type_ids:
            raise serializers.ValidationError("Lesson Type must be specified either globally or in schedule items.")

        existing_count = LessonType.objects.filter(id__in=needed_type_ids).count()
        if existing_count != len(needed_type_ids):
            raise serializers.ValidationError("One or more Lesson Types are invalid.")

        return data


class ChangeStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=LessonStatus.choices)
    reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        new_status = data.get('status')
        reason = data.get('reason')

        cancellation_statuses = [
            LessonStatus.CANCELLED_BY_STUDENT,
            LessonStatus.CANCELLED_BY_TEACHER
        ]

        if new_status in cancellation_statuses and not reason:
            raise serializers.ValidationError({
                "reason": "Reason is required when cancelling a lesson."
            })

        return data


###
### Плани уроків
###
class LessonPlanUpdateSerializer(serializers.ModelSerializer):
    send_for_review = serializers.BooleanField(write_only=True, default=False)

    class Meta:
        model = Lesson
        fields = ['lesson_plan', 'send_for_review']


class LessonPlanReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    feedback = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['action'] == 'reject' and not data.get('feedback'):
            raise serializers.ValidationError({"feedback": "Comment is required if plan is rejected."})
        return data


class LessonStudentRateSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    value = serializers.FloatField(min_value=0.0)
    comment = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Lesson
        fields = ['student', 'value', 'comment']

    def validate_student(self, value):
        lesson = self.context.get('lesson')
        if not lesson:
            return value

        exists = GroupStudent.objects.filter(
            group=lesson.group,
            student=value,
            status=GroupStudentStatus.ACTIVE
        ).exists()

        if not exists:
            raise serializers.ValidationError(
                f"Student with ID {value} is not a member of group {lesson.group.name} or is not active."
            )

        return value


class LessonStudentUnrateSerializer(serializers.ModelSerializer):
    grade = serializers.PrimaryKeyRelatedField(queryset=Grade.objects.all())

    class Meta:
        model = Lesson
        fields = ['grade']


class TaskSerializer(CreatedByMixin, serializers.ModelSerializer):
    assignee = SimpleUserSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assignee',
        write_only=True
    )

    deadline = StrictDateTimeField(
        input_formats=['iso-8601'],
        required=False
    )

    class Meta:
        model = Task
        fields = [
            'id',
            'title', 'description',
            'assignee', 'assignee_id',
            'status',
            'deadline',
            'google_task_id', 'google_tasklist_id',
            'created_at', 'updated_at',
            'created_by'
        ]
        read_only_fields = [
            'id', 'created_by', 'google_task_id', 'google_tasklist_id', 'created_at', 'updated_at',
        ]

    def validate(self, data):
        instance = self.instance
        deadline = data.get('deadline', getattr(instance, 'deadline', None))

        if 'deadline' in data and deadline and deadline < timezone.now():
            raise serializers.ValidationError({"deadline": "Cannot set deadline in the past."})

        request = self.context.get('request')
        if request and request.user:
            user = request.user

            if not user.has_permission('tasks.manage_all'):
                assignee = data.get('assignee')

                if assignee and assignee != user:
                    raise serializers.ValidationError(
                        {"assignee_id": "Cannot create Task for another user. Lack of permissions."})

                if instance and instance.created_by != user:
                    if instance.assignee == user:
                        allowed_fields = {'status'}
                        changed_fields = set(data.keys())

                        if not changed_fields.issubset(allowed_fields):
                            raise serializers.ValidationError(
                                {"message": "You can only update the status of tasks assigned to you."}
                            )
                    else:
                        raise serializers.ValidationError(
                            {"message": "Cannot edit this task. Lack of permissions."}
                        )
        return data
