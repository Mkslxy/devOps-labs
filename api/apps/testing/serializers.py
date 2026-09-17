from django.db import transaction
from rest_framework import serializers

from apps.classes.models import Lesson, Group
from apps.classes.serializers import LessonSerializer, GroupSerializer
from apps.core.mixins import CreatedByMixin
from apps.courses.models import Material
from apps.courses.serializers import MaterialSerializer
from apps.gradebook.serializers import GradeSerializer
from apps.gradebook.services import create_assignment_column
from apps.testing.models import TestVersion, Question, QuestionOption, TestAttempt, StudentAnswerItem, StudentAnswer, \
    OnboardingStudentAnswerItem, OnboardingStudentAnswer
from apps.testing.models.onboarding_test_attempt import OnboardingTestAttempt
from apps.testing.models.question import QuestionType
from apps.testing.models.test import Test
from apps.testing.models.test_assigment import TestAssignment
from apps.testing.models.test_version import TestStatus
from apps.users.serializers import SimpleUserSerializer


class QuestionOptionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = QuestionOption
        fields = [
            'id',
            'option_text',
            'is_correct',
            'explanation',
            'match_pair_text',
            'correct_order',
            'blank_group_id'
        ]


class QuestionSerializer(CreatedByMixin, serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = [
            'id',
            'text',
            'media_url',
            'points',
            'type',
            'explanation',
            'options'
        ]

    def validate(self, data):
        question_type = data.get('type')
        options = data.get('options', [])

        if question_type in [QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE]:
            if not options:
                raise serializers.ValidationError("This question type must have options.")

            correct_count = sum(1 for opt in options if opt.get('is_correct'))

            if question_type == QuestionType.SINGLE_CHOICE and correct_count != 1:
                raise serializers.ValidationError(
                    "This question type must have exactly one correct answer.")

            if question_type == QuestionType.MULTIPLE_CHOICE and correct_count < 1:
                raise serializers.ValidationError(
                    "This question type must have at least one correct answer.")

        return data

    @transaction.atomic
    def create(self, validated_data):
        options_data = validated_data.pop('options', [])

        question = super().create(validated_data)

        for option in options_data:
            QuestionOption.objects.create(question=question, **option)

        return question

    @transaction.atomic
    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)

        instance = super().update(instance, validated_data)

        if options_data is not None:
            existing_options = {opt.id: opt for opt in instance.options.all()}

            incoming_ids = [item.get('id') for item in options_data if item.get('id')]

            for opt_id, opt_obj in existing_options.items():
                if opt_id not in incoming_ids:
                    opt_obj.delete()

            for option_item in options_data:
                opt_id = option_item.get('id')

                if opt_id and opt_id in existing_options:
                    option_obj = existing_options[opt_id]
                    for key, value in option_item.items():
                        setattr(option_obj, key, value)
                    option_obj.save()
                else:
                    option_item.pop('id', None)
                    QuestionOption.objects.create(question=instance, **option_item)

        return instance


class TestVersionDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    test = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = TestVersion
        fields = [
            'id',
            'test',
            'time_limit_minutes',
            'passing_score_percent',
            'is_random_order',
            'questions',
            'status'
        ]

    def validate(self, attrs):
        if self.instance.status != TestStatus.DRAFT:
            forbidden = set(attrs) - {'status'}
            if forbidden:
                raise serializers.ValidationError(
                    {"message": "You can update only status for published or archived versions."}
                )
        return attrs


class TestVersionSerializer(CreatedByMixin, serializers.ModelSerializer):
    test = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by = SimpleUserSerializer(read_only=True)

    class Meta:
        model = TestVersion
        fields = [
            'id',
            'test',
            'time_limit_minutes',
            'passing_score_percent',
            'is_random_order',
            'status',
            'created_by'
        ]

    def validate(self, attrs):
        if self.instance.status != TestStatus.DRAFT:
            forbidden = set(attrs) - {'status'}
            if forbidden:
                raise serializers.ValidationError(
                    {"message": "You can update only status for published or archived versions."}
                )
        return attrs


class TestSerializer(CreatedByMixin, serializers.ModelSerializer):
    current_version = TestVersionSerializer(read_only=True)

    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'current_version']

    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user

        test = Test.objects.create(created_by=user, **validated_data)

        first_version = TestVersion.objects.create(
            test=test,
            version_number=1,
            status=TestStatus.DRAFT,
        )

        test.current_version = first_version
        test.save()

        return test


class TestSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Test
        fields = [
            'id',
            'title',
            'description',
        ]


class QuestionListSerializer(serializers.Serializer):
    question_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        help_text="List of Question IDs to add"
    )


class TestAssignmentSerializer(CreatedByMixin, serializers.ModelSerializer):
    test_id = serializers.PrimaryKeyRelatedField(
        queryset=Test.objects.all(), source='test', write_only=True
    )
    pinned_version_id = serializers.PrimaryKeyRelatedField(
        queryset=TestVersion.objects.all(), source='pinned_version',
        write_only=True, required=False, allow_null=True
    )
    lesson_id = serializers.PrimaryKeyRelatedField(
        queryset=Lesson.objects.all(), source='lesson',
        write_only=True, required=False, allow_null=True
    )
    material_id = serializers.PrimaryKeyRelatedField(
        queryset=Material.objects.all(), source='material',
        write_only=True, required=False, allow_null=True
    )
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(), source='group',
        write_only=True, required=False, allow_null=True
    )

    test = TestSimpleSerializer(read_only=True)
    pinned_version = TestVersionSerializer(read_only=True)
    lesson = LessonSerializer(read_only=True)
    material = MaterialSerializer(read_only=True)
    group = GroupSerializer(read_only=True)

    created_by = SimpleUserSerializer(read_only=True)

    class Meta:
        model = TestAssignment
        fields = [
            'id',
            'public_uid',
            'test', 'test_id',
            'pinned_version', 'pinned_version_id',
            'lesson', 'lesson_id',
            'material', 'material_id',
            'group', 'group_id',
            'custom_time_limit', 'custom_passing_score',
            'pinned_version',
            'show_answers',
            'created_at',
            'starting_at', 'closing_at',
            'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'public_uid']

    def validate(self, attrs):
        instance = self.instance

        lesson = attrs.get('lesson')
        if 'lesson' not in attrs and instance:
            lesson = instance.lesson

        material = attrs.get('material')
        if 'material' not in attrs and instance:
            material = instance.material

        group = attrs.get('group')
        if 'group' not in attrs and instance:
            group = instance.group

        connections_count = sum([bool(lesson), bool(material), bool(group), ])

        if connections_count > 1 or connections_count == 0:
            raise serializers.ValidationError(
                {"detail": "Test Assignment cannot be assigned to more then one (or to be unassigned object at the "
                           "same time. "}
            )

        test = attrs.get('test')
        if 'test' not in attrs and instance:
            test = instance.test

        pinned_version = None
        if 'pinned_version' in attrs:
            pinned_version = attrs['pinned_version']
        elif instance:
            pinned_version = instance.pinned_version

        if pinned_version:
            if test and pinned_version.test != test:
                raise serializers.ValidationError({
                    "pinned_version_id": f"Version #{pinned_version.version_number} is not belong to the test "
                                         f"'{test.title}'."
                })

            if pinned_version.status == TestStatus.DRAFT:
                raise serializers.ValidationError({
                    "pinned_version_id": "You cannot assign a student to a draft version. "
                                         "Please publish the version first."
                })

            if not test:
                attrs['test'] = pinned_version.test

        elif test:
            if not test.current_version:
                raise serializers.ValidationError({
                    "test": "This test does not have any published versions yet. "
                            "Please publish a version first."
                })

            if test.current_version.status == TestStatus.DRAFT:
                raise serializers.ValidationError({
                    "test": "The current active version of the test is a draft. "
                            "Please publish it first before assigning."
                })

        return attrs

    def create(self, validated_data):
        column = create_assignment_column(validated_data)
        validated_data['grade_column'] = column

        assignment = super().create(validated_data)

        return assignment


###
### STUDENTS TESTS
###
class QuestionOptionStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = [
            'id',
            'option_text',
            'match_pair_text'
        ]
        read_only_fields = fields


class QuestionStudentSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id',
            'text',
            'media_url',
            'points',
            'type',
            'options'
        ]
        read_only_fields = fields

    def get_options(self, obj):
        if obj.type == QuestionType.MATCHING:
            left_side = []
            right_side_values = []

            for opt in obj.options.all():
                left_side.append({"id": opt.id, "text": opt.option_text})
                if opt.match_pair_text:
                    right_side_values.append(opt.match_pair_text)

            import random
            random.shuffle(right_side_values)

            return {"pairs": left_side, "choices": right_side_values}

        elif obj.type == QuestionType.ORDERING:
            items = [{"id": opt.id, "text": opt.option_text} for opt in obj.options.all()]
            import random
            random.shuffle(items)
            return items

        visible_types = [
            QuestionType.SINGLE_CHOICE,
            QuestionType.MULTIPLE_CHOICE
        ]
        if obj.type in visible_types:
            return QuestionOptionStudentSerializer(obj.options.all(), many=True).data

        return []


class StudentAnswerInputSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()

    selected_option_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )

    text_response = serializers.CharField(required=False, allow_blank=True)


class TestAttemptStartSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()


class TestAttemptFinishSerializer(serializers.Serializer):
    answers = StudentAnswerInputSerializer(many=True)


class BaseTestAttemptDetailSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(
        source='test_version.test.title',
        read_only=True
    )
    test_description = serializers.CharField(
        source='test_version.test.description',
        read_only=True
    )

    questions = serializers.SerializerMethodField()
    deadline = serializers.ReadOnlyField()
    remaining_seconds = serializers.ReadOnlyField()

    class Meta:
        abstract = True
        fields = [
            'id',
            'status',
            'test_title',
            'test_description',
            'started_at',
            'deadline',
            'remaining_seconds',
            'questions',
        ]

    def get_questions(self, obj):
        return QuestionStudentSerializer(
            obj.questions_qs, many=True
        ).data


class TestAttemptDetailSerializer(BaseTestAttemptDetailSerializer):
    class Meta(BaseTestAttemptDetailSerializer.Meta):
        model = TestAttempt


###
### STUDENTS ANSWERS
###
class BaseStudentAnswerItemSerializer(serializers.ModelSerializer):
    selected_option_text = serializers.CharField(source='selected_option.option_text', read_only=True)

    class Meta:
        abstract = True
        fields = ['id', 'selected_option', 'selected_option_text', 'text_response']


class StudentAnswerItemSerializer(BaseStudentAnswerItemSerializer):
    class Meta(BaseStudentAnswerItemSerializer.Meta):
        model = StudentAnswerItem


class BaseStudentAnswerReviewSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    question_points = serializers.FloatField(source='question.points', read_only=True)
    items = StudentAnswerItemSerializer(many=True, read_only=True)

    correct_options = serializers.SerializerMethodField()

    class Meta:
        abstract = True
        fields = [
            'id',
            'question_text',
            'question_points',
            'score_awarded',
            'teacher_comment',
            'items',
            'correct_options'
        ]

    def get_correct_options(self, obj):
        return obj.question.options.filter(is_correct=True).values('id', 'option_text')


class StudentAnswerReviewSerializer(BaseStudentAnswerReviewSerializer):
    class Meta(BaseStudentAnswerReviewSerializer.Meta):
        model = StudentAnswer


class TestAttemptReviewSerializer(serializers.ModelSerializer):
    answers = StudentAnswerReviewSerializer(many=True, read_only=True)
    final_grade = serializers.FloatField(write_only=True, min_value=0)

    class Meta:
        model = TestAttempt
        fields = [
            'id',
            'status',
            'grade', 'final_grade',
            'max_possible_score',
            'answers'
        ]


class BaseStudentAnswerGradeSerializer(serializers.ModelSerializer):
    score_awarded = serializers.FloatField(required=True, min_value=0)
    teacher_comment = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        abstract = True
        fields = ['score_awarded', 'teacher_comment']

    def validate(self, attrs):
        instance = self.instance
        new_score = attrs.get('score_awarded')

        if new_score is not None and instance.question.points < new_score:
            raise serializers.ValidationError({
                "score_awarded": f"Mark ({new_score}) cannot to be higher than maximum possible points "
                                 f"({instance.question.points})."
            })

        return attrs


class StudentAnswerGradeSerializer(BaseStudentAnswerGradeSerializer):
    class Meta(BaseStudentAnswerGradeSerializer.Meta):
        model = StudentAnswer


class TeacherAttemptListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    test_title = serializers.CharField(source='test_version.test.title', read_only=True)
    assignment_id = serializers.IntegerField(source='assignment.id', read_only=True)

    class Meta:
        model = TestAttempt
        fields = [
            'id',
            'student_id',
            'student_name',
            'student_email',
            'test_title',
            'assignment_id',
            'status',
            'grade',
            'max_possible_score',
            'is_passed',
            'started_at',
            'finished_at'
        ]


### TEST FOR STUDENT ORGANIZING
class OnboardingTestAssignmentSerializer(serializers.ModelSerializer):
    test_id = serializers.PrimaryKeyRelatedField(
        queryset=Test.objects.all(), source='test', write_only=True
    )
    pinned_version_id = serializers.PrimaryKeyRelatedField(
        queryset=TestVersion.objects.all(), source='pinned_version',
        write_only=True, required=False, allow_null=True
    )

    test = TestSimpleSerializer(read_only=True)
    pinned_version = TestVersionSerializer(read_only=True)

    created_by = SimpleUserSerializer(read_only=True)

    class Meta:
        model = TestAssignment
        fields = [
            'id',
            'test', 'test_id',
            'pinned_version', 'pinned_version_id',
            'custom_time_limit', 'custom_passing_score',
            'pinned_version',
            'show_answers',
            'created_at',
            'starting_at', 'closing_at',
            'created_by'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        instance = self.instance

        test = attrs.get('test')
        if test is None and instance:
            test = instance.test

        pinned_version = attrs.get('pinned_version')
        if pinned_version is None and instance:
            pinned_version = instance.pinned_version

        if pinned_version:
            if test and pinned_version.test != test:
                raise serializers.ValidationError({
                    "pinned_version_id": f"Version #{pinned_version.version_number} is not belong to the test "
                                         f"'{test.title}'."
                })

            if pinned_version.status == TestStatus.DRAFT:
                raise serializers.ValidationError({
                    "pinned_version_id": "You cannot assign a student to a draft version. "})

            if not test:
                attrs['test'] = pinned_version.test

        elif test:
            if not test.current_version:
                raise serializers.ValidationError({
                    "test": "This test does not have any published versions yet. "})

            if test.current_version.status == TestStatus.DRAFT:
                raise serializers.ValidationError({
                    "test": "The current active version of the test is a draft. "})

        return attrs


class OnboardingTestAttemptStartSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()
    email = serializers.EmailField()
    name = serializers.CharField()


class OnboardingTestAttemptFinishSerializer(serializers.Serializer):
    answers = StudentAnswerInputSerializer(many=True)


class OnboardingTestAttemptResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingTestAttempt
        fields = [
            'id',
            'status',
            'score', 'max_possible_score', 'is_passed',
            'started_at', 'finished_at'
        ]


class OnboardingTestAttemptDetailSerializer(BaseTestAttemptDetailSerializer):
    class Meta(BaseTestAttemptDetailSerializer.Meta):
        model = OnboardingTestAttempt


class OnboardingStudentAnswerItemSerializer(BaseStudentAnswerItemSerializer):
    class Meta(BaseStudentAnswerItemSerializer.Meta):
        model = OnboardingStudentAnswerItem


class OnboardingStudentAnswerReviewSerializer(BaseStudentAnswerReviewSerializer):
    class Meta(BaseStudentAnswerReviewSerializer.Meta):
        model = OnboardingStudentAnswer


class OnboardingTestAttemptReviewSerializer(serializers.ModelSerializer):
    answers = StudentAnswerReviewSerializer(many=True, read_only=True)
    final_grade = serializers.FloatField(write_only=True, min_value=0)

    class Meta:
        model = OnboardingTestAttempt
        fields = [
            'id',
            'status',
            'score', 'final_grade',
            'max_possible_score',
            'answers'
        ]


class OnboardingStudentAnswerGradeSerializer(BaseStudentAnswerGradeSerializer):
    class Meta(BaseStudentAnswerGradeSerializer.Meta):
        model = OnboardingStudentAnswer


class TeacherOnboardingAttemptListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='actual_name', read_only=True)
    student_email = serializers.CharField(source='actual_email', read_only=True)
    test_title = serializers.CharField(source='test_version.test.title', read_only=True)
    assignment_id = serializers.IntegerField(source='assignment.id', read_only=True)

    class Meta:
        model = OnboardingTestAttempt
        fields = [
            'id',
            'student_id',
            'student_name',
            'student_email',
            'test_title',
            'assignment_id',
            'status',
            'score',
            'max_possible_score',
            'is_passed',
            'started_at',
            'finished_at'
        ]


### LINK SHARING
class PublicTestAssignmentSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='test.title', read_only=True)
    description = serializers.CharField(source='test.description', read_only=True)

    time_limit_minutes = serializers.SerializerMethodField()
    passing_score_percent = serializers.SerializerMethodField()

    class Meta:
        model = TestAssignment
        fields = [
            'id',
            'public_uid',
            'title',
            'description',
            'starting_at',
            'closing_at',
            'time_limit_minutes',
            'passing_score_percent'
        ]
        read_only_fields = fields

    def get_time_limit_minutes(self, obj):
        if obj.custom_time_limit is not None:
            return obj.custom_time_limit
        if obj.actual_version:
            return obj.actual_version.time_limit_minutes
        return None

    def get_passing_score_percent(self, obj):
        if obj.custom_passing_score is not None:
            return obj.custom_passing_score
        if obj.actual_version:
            return obj.actual_version.passing_score_percent
        return None


class TestAttemptResultSerializer(serializers.ModelSerializer):
    grade = GradeSerializer(read_only=True)

    class Meta:
        model = TestAttempt
        fields = [
            'id',
            'status',
            'grade', 'max_possible_score', 'is_passed',
            'started_at', 'finished_at'
        ]
