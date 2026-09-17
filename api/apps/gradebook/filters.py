import django_filters
from django_filters import IsoDateTimeFilter, DateFilter

from apps.gradebook.models import Grade, Attendance, GradeColumn


class GradeFilterSet(django_filters.FilterSet):
    created_after = IsoDateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = IsoDateTimeFilter(field_name='created_at', lookup_expr='lte')

    group = django_filters.NumberFilter(field_name='column__group')

    value_min = django_filters.NumberFilter(field_name='value', lookup_expr='gte')
    value_max = django_filters.NumberFilter(field_name='value', lookup_expr='lte')

    class Meta:
        model = Grade
        fields = (
            'student',
            'column',
            'category',
            'group',
            'value_min', 'value_max',
            'created_after', 'created_before',
            'created_by'
        )


class AttendanceFilterSet(django_filters.FilterSet):
    created_after = IsoDateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = IsoDateTimeFilter(field_name='created_at', lookup_expr='lte')
    group = django_filters.NumberFilter(field_name='column__group')

    class Meta:
        model = Attendance
        fields = (
            'student',
            'column',
            'category',
            'group',
            'created_after', 'created_before',
            'created_by'
        )


class GradeColumnFilterSet(django_filters.FilterSet):
    date_after = DateFilter(field_name='date', lookup_expr='gte')
    date_before = DateFilter(field_name='date', lookup_expr='lte')

    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')

    class Meta:
        model = GradeColumn
        fields = (
            'group',
            'date_after', 'date_before',
            'title'
        )
