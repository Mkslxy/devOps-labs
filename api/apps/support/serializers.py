from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from apps.classes.models import Lesson
from apps.classes.serializers import SimpleLessonSerializer
from apps.core.mixins import CreatedByMixin
from apps.core.utils import get_connections_count
from apps.courses.models import Course
from apps.courses.serializers import CourseSerializer
from apps.support.models import CallbackRequest
from apps.support.models.feedback import Feedback
from apps.users.models import User
from apps.users.serializers import SimpleUserSerializer, UserSerializer


class CallbackRequestSerializer(serializers.ModelSerializer):
    processed_by = SimpleUserSerializer(read_only=True)

    class Meta:
        model = CallbackRequest
        fields = '__all__'
        read_only_fields = [
            'id',
            'phone_normalized',
            'processed_by',
            'created_at', 'updated_at'
        ]

    def validate(self, data):
        user = self.context['request'].user

        phone_country_code, phone_national_number = data.get('phone_country_code'), data.get('phone_national_number')
        if phone_country_code and phone_national_number:
            data['phone_normalized'] = f"{phone_country_code}{phone_national_number}"

        if not user.is_authenticated or not user.has_permission('callback-request.write'):
            data.pop("manager_comment", None)
            return data

        status = data.get('status')
        if status == "new":
            data['processed_by'] = None

        if status in ['in_progress', 'converted', 'rejected', 'archived']:
            data['processed_by'] = user

        return data


class FeedbackSerializer(CreatedByMixin, serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    lesson = SimpleLessonSerializer(read_only=True)
    course = CourseSerializer(read_only=True)

    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__slug='teacher'),
        source='user',
        write_only=True,
        required=False,
        allow_null=True
    )
    lesson_id = serializers.PrimaryKeyRelatedField(
        queryset=Lesson.objects.all(),
        source='lesson',
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

    rating = serializers.IntegerField(required=True, min_value=0, max_value=10)

    created_by = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Feedback
        fields = (
            'id',
            'type',
            'user', 'lesson', 'course',
            'user_id', 'lesson_id', 'course_id',
            'rating', 'comment',
            'created_by', 'created_at'
        )
        read_only_fields = (
            'id', 'created_by', 'created_at'
        )

    def validate(self, data):
        instance = self.instance

        user = data.get('user', getattr(instance, 'user', None))
        lesson = data.get('lesson', getattr(instance, 'lesson', None))
        course = data.get('course', getattr(instance, 'course', None))

        conn_count = get_connections_count(user, lesson, course)
        if conn_count > 1 or conn_count == 0:
            raise ValidationError("You have to have only one connected object (lesson, course, user).")

        return data

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return

        user = request.user

        self.fields['lesson_id'].queryset = (
            Lesson.objects
            .select_related('group', 'teacher')
            .prefetch_related('group__custom_user_set')
            .order_by('-start_time')
            .filter(group__in=user.groups.all())
        )
