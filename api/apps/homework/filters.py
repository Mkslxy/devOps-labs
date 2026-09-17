import django_filters

from apps.homework.models import Homework, HomeworkSubmission


class HomeworkFilterSet(django_filters.FilterSet):
    lesson = django_filters.NumberFilter(field_name='lesson_id')
    student = django_filters.NumberFilter(field_name='student_id')
    group = django_filters.NumberFilter(field_name='group_id')

    deadline = django_filters.DateTimeFromToRangeFilter()
    created_at = django_filters.DateFromToRangeFilter()

    class Meta:
        model = Homework
        fields = (
            'lesson', 'student', 'group',
            'deadline', 'created_at',
        )


class HomeworkSubmissionFilterSet(django_filters.FilterSet):
    homework = django_filters.NumberFilter(field_name='homework_id')
    student = django_filters.NumberFilter(field_name='student_id')

    created_at = django_filters.DateFromToRangeFilter()

    lesson = django_filters.NumberFilter(field_name='homework__lesson_id')
    group = django_filters.NumberFilter(field_name='homework__group_id')

    class Meta:
        model = HomeworkSubmission
        fields = (
            'homework', 'student', 'lesson', 'group',
            'created_at',
        )
