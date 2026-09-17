import django_filters
from django.db.models import Q

from apps.courses.models import Task, TaskSubmission, Course, CourseModule, CourseTopic, Material


class TaskFilterSet(django_filters.FilterSet):
    topic_id = django_filters.NumberFilter(field_name='topic__id')
    course_id = django_filters.NumberFilter(field_name='topic__module__course__id')

    created_by = django_filters.NumberFilter(field_name='created_by')

    class Meta:
        model = Task
        fields = ['topic_id', 'course_id', 'created_by']


class TaskSubmissionFilterSet(django_filters.FilterSet):
    group_id = django_filters.NumberFilter(field_name='student__groupstudent__group__id')
    task_id = django_filters.NumberFilter(field_name='task__id')
    student_id = django_filters.NumberFilter(field_name='student__id')

    is_rated = django_filters.BooleanFilter(field_name='grade', lookup_expr='isnull', exclude=True)

    class Meta:
        model = TaskSubmission
        fields = ['group_id', 'task_id', 'student_id', 'is_rated']


class CourseFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_by_search')

    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    class Meta:
        model = Course
        fields = ['is_active', 'level', 'subject', 'created_by']

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value) |
            Q(description__icontains=value)
        )


class CourseModuleFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_by_search')

    class Meta:
        model = CourseModule
        fields = ['course', 'created_by']

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(Q(title__icontains=value))


class CourseTopicFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_by_search')

    course = django_filters.NumberFilter(field_name='module__course')

    class Meta:
        model = CourseTopic
        fields = ['module', 'created_by']

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value) |
            Q(content_description__icontains=value)
        )


class MaterialFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_by_search')

    module = django_filters.NumberFilter(field_name='topic__module')
    course = django_filters.NumberFilter(field_name='topic__module__course')

    class Meta:
        model = Material
        fields = ['access_level', 'topic', 'created_by']

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value) |
            Q(description__icontains=value)
        )
