import django_filters
from django.db.models import Q
from django_filters import IsoDateTimeFilter

from apps.classes.models import Group, Lesson
from apps.courses.models import Material
from apps.testing.models import Question, Test, TestVersion, TestAttempt, StudentAnswer, OnboardingTestAttempt, \
    OnboardingStudentAnswer
from apps.testing.models.question import QuestionType
from apps.testing.models.test_assigment import TestAssignment
from apps.testing.models.test_attempt import TestAttemptStatus
from apps.testing.models.test_version import TestStatus
from apps.users.models import User


class QuestionFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(
        method='search_filter',
        label='Search by Question text, option text, or their explanations.'
    )
    type = django_filters.ChoiceFilter(choices=QuestionType.choices)
    created_by = django_filters.ModelChoiceFilter(queryset=User.objects.all())

    class Meta:
        model = Question
        fields = ('search', 'type', 'created_by')

    def search_filter(self, queryset, name, value):
        if not value:
            return queryset

        return queryset.filter(
            Q(text__icontains=value) |
            Q(options__option_text__icontains=value) |
            Q(options__explanation__icontains=value) |
            Q(explanation__icontains=value)
        ).distinct()


class TestFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(
        method='search_filter',
        label='Search by Test title or description.'
    )
    created_by = django_filters.ModelChoiceFilter(queryset=User.objects.all())

    class Meta:
        model = Test
        fields = ('search', 'created_by')

    def search_filter(self, queryset, name, value):
        if not value:
            return queryset

        return queryset.filter(
            Q(title__icontains=value) |
            Q(description__icontains=value)
        )


class TestVersionFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(
        method='search_filter',
        label='Search by questions text and explanations.'
    )
    test = django_filters.ModelChoiceFilter(queryset=Test.objects.all())
    status = django_filters.ChoiceFilter(choices=TestStatus.choices)
    created_by = django_filters.ModelChoiceFilter(queryset=User.objects.all())

    class Meta:
        model = TestVersion
        fields = ('search',)

    def search_filter(self, queryset, name, value):
        if not value:
            return queryset

        return queryset.filter(
            Q(questions__text__icontains=value) |
            Q(questions__options__option_text__icontains=value) |
            Q(questions__options__explanation__icontains=value) |
            Q(questions__explanation__icontains=value)
        ).distinct()


class TestAssignmentFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(
        method='search_filter',
        label='Search by Test title or description.'
    )

    test = django_filters.ModelChoiceFilter(queryset=Test.objects.all())

    material = django_filters.ModelChoiceFilter(queryset=Material.objects.all())
    lesson = django_filters.ModelChoiceFilter(queryset=Lesson.objects.all())
    group = django_filters.ModelChoiceFilter(queryset=Group.objects.all())

    actual_version = django_filters.NumberFilter(method='actual_version_filter', min_value=1)

    created_by = django_filters.ModelChoiceFilter(queryset=User.objects.all())

    created_after = IsoDateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = IsoDateTimeFilter(field_name='created_at', lookup_expr='lte')
    starting_after = IsoDateTimeFilter(field_name='starting_at', lookup_expr='gte')
    starting_before = IsoDateTimeFilter(field_name='starting_at', lookup_expr='lte')
    closing_after = IsoDateTimeFilter(field_name='closing_at', lookup_expr='gte')
    closing_before = IsoDateTimeFilter(field_name='closing_at', lookup_expr='lte')

    class Meta:
        model = TestAssignment
        fields = (
            'test',
            'material', 'lesson', 'group',
            'created_by',
            'created_after', 'created_before',
            'starting_after', 'starting_before',
            'closing_after', 'closing_before',
            'actual_version'
        )

    def search_filter(self, queryset, name, value):
        if not value:
            return queryset

        return queryset.filter(
            Q(test__title__icontains=value) |
            Q(test__description__icontains=value)
        ).distinct()

    def actual_version_filter(self, queryset, name, value):
        if value is None:
            return queryset

        return queryset.filter(
            Q(pinned_version__version_number=value) |
            Q(pinned_version__isnull=True, test__current_version__version_number=value)
        ).distinct()


class OnboardingTestAssignmentFilterSet(TestAssignmentFilterSet):
    material = None
    lesson = None
    group = None

    class Meta(TestAssignmentFilterSet.Meta):
        fields = (
            'test',
            'created_by',
            'created_after', 'created_before',
            'starting_after', 'starting_before',
            'closing_after', 'closing_before',
            'actual_version',
        )


class TestAttemptFilterSet(django_filters.FilterSet):
    student = django_filters.ModelChoiceFilter(queryset=User.objects.all())
    test_version = django_filters.ModelChoiceFilter(queryset=TestVersion.objects.all())
    assignment = django_filters.ModelChoiceFilter(queryset=TestAssignment.objects.all())
    status = django_filters.ChoiceFilter(choices=TestAttemptStatus.choices)
    is_passed = django_filters.BooleanFilter()

    min_grade = django_filters.NumberFilter(field_name='grade__value', lookup_expr='gte')
    max_grade = django_filters.NumberFilter(field_name='grade__value', lookup_expr='lte')

    class Meta:
        model = TestAttempt
        fields = (
            'student',
            'test_version', 'assignment',
            'status', 'is_passed',
            'min_grade', 'max_grade'
        )


class OnboardingTestAttemptFilterSet(TestAttemptFilterSet):
    min_grade = django_filters.NumberFilter(field_name='score', lookup_expr='gte')
    max_grade = django_filters.NumberFilter(field_name='score', lookup_expr='lte')

    class Meta(TestAttemptFilterSet.Meta):
        model = OnboardingTestAttempt


class StudentAnswerFilterSet(django_filters.FilterSet):
    student = django_filters.ModelChoiceFilter(queryset=User.objects.all(), field_name='attempt__student')
    attempt = django_filters.ModelChoiceFilter(queryset=TestAttempt.objects.all())

    class Meta:
        model = StudentAnswer
        fields = ('student', 'attempt',)


class OnboardingStudentAnswerFilterSet(StudentAnswerFilterSet):
    class Meta(StudentAnswerFilterSet.Meta):
        model = OnboardingStudentAnswer
