import django_filters
from django.db.models import Q

from apps.classes.models import Lesson, School, Task, InternalMeeting, Group


class GroupFilterSet(django_filters.FilterSet):
    teacher = django_filters.NumberFilter(field_name='teacher_id')
    course = django_filters.NumberFilter(field_name='course_id')

    class Meta:
        model = Group
        fields = ['status', 'age_group', 'knowledge_level']


class LessonFilter(django_filters.FilterSet):
    start = django_filters.IsoDateTimeFilter(field_name='start_time', lookup_expr='gte')
    end = django_filters.IsoDateTimeFilter(field_name='start_time', lookup_expr='lte')
    date = django_filters.DateFilter(field_name='start_time', lookup_expr='date')

    class Meta:
        model = Lesson
        fields = [
            'status',
            'teacher', 'group',
            'group__age_group', 'group__knowledge_level', 'group__is_online',
            'group__school',
        ]


class SchoolFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_by_search')

    class Meta:
        model = School
        fields = ['search']

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value) |
            Q(address__icontains=value) |
            Q(city__icontains=value)
        )


class TaskFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_by_search')

    created_at = django_filters.DateTimeFromToRangeFilter()
    updated_at = django_filters.DateTimeFromToRangeFilter()
    deadline = django_filters.DateFromToRangeFilter()
    date = django_filters.DateFilter(field_name='deadline', lookup_expr='date')

    class Meta:
        model = Task
        fields = ['status', 'assignee']

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value) |
            Q(description__icontains=value)
        )


class InternalMeetingFilterSet(django_filters.FilterSet):
    created_at = django_filters.DateTimeFromToRangeFilter()
    updated_at = django_filters.DateTimeFromToRangeFilter()

    search = django_filters.CharFilter(method='filter_by_search')

    class Meta:
        model = InternalMeeting
        fields = ['is_online', 'created_by']

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value) |
            Q(description__icontains=value)
        )
