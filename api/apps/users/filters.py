from datetime import timedelta, datetime

import django_filters
from django.db.models import Q

from apps.classes.models import School
from apps.users.models import User
from apps.users.utils import years_ago


class UserFilter(django_filters.FilterSet):
    role = django_filters.NumberFilter(field_name='role', lookup_expr='exact')
    role_slug = django_filters.CharFilter(field_name='role__slug', lookup_expr='iexact')
    search = django_filters.CharFilter(method='filter_by_search')
    age_gte = django_filters.NumberFilter(method='filter_by_age_gte')
    age_lte = django_filters.NumberFilter(method='filter_by_age_lte')
    schools = django_filters.ModelMultipleChoiceFilter(
        queryset=School.objects.all(),
        to_field_name='id',
        conjoined=True
    )

    class Meta:
        model = User
        fields = ["search", "role", "age_gte", "age_lte", "schools"]

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(full_name__icontains=value) |
            Q(email__icontains=value) |
            Q(phone_normalized__icontains=value)
        )

    def filter_by_age_gte(self, queryset, name, value):
        cutoff_date = years_ago(value)
        return queryset.filter(
            Q(date_of_birth__lte=cutoff_date) |
            Q(date_of_birth__isnull=True)
        )

    def filter_by_age_lte(self, queryset, name, value):
        cutoff_date = years_ago(value)
        return queryset.filter(
            Q(date_of_birth__gte=cutoff_date) |
            Q(date_of_birth__isnull=True)
        )
