import django_filters
from django.db.models import Q

from apps.crm.models import Lead, LeadStatus


class LeadFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(
        method='search_filter',
        label='Search by Lead name, email, phone, source or notes.'
    )
    status = django_filters.ChoiceFilter(choices=LeadStatus.choices)

    class Meta:
        model = Lead
        fields = (
            'search',
            'status',
            'manager'
        )

    def search_filter(self, queryset, name, value):
        if not value:
            return queryset

        return queryset.filter(
            Q(name=value) |
            Q(email=value) |
            Q(phone=value) |
            Q(source=value) |
            Q(notes=value)
        )
