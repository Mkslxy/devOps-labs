import django_filters
from django.db.models import Q

from apps.support.models import CallbackRequest
from apps.support.models.callback_request import ContactPreference, RequestStatus
from apps.support.models.feedback import Feedback


class CallbackRequestFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(method="search_filter", label="Search by name, email, or phone number")
    contact_preference = django_filters.ChoiceFilter(choices=ContactPreference.choices)
    status = django_filters.ChoiceFilter(choices=RequestStatus.choices)

    callback_page = django_filters.CharFilter(field_name='callback_page', lookup_expr='icontains')

    class Meta:
        model = CallbackRequest
        fields = [
            'search',
            'contact_preference', 'status',
            'callback_page'
        ]

    def search_filter(self, queryset, name, value):
        if not value:
            return queryset

        return queryset.filter(
            Q(name__icontains=value) |
            Q(email__icontains=value) |
            Q(phone_number__icontains=value)
        )


class FeedbackFilterSet(django_filters.FilterSet):
    rating_gte = django_filters.NumberFilter(field_name='rating', lookup_expr='gte')
    rating_lte = django_filters.NumberFilter(field_name='rating', lookup_expr='lte')

    created_at_gte = django_filters.IsoDateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_at_lte = django_filters.IsoDateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Feedback
        fields = [
            'type',
            'rating_gte', 'rating_lte',
            'created_at_gte', 'created_at_lte',
            'lesson', 'course', 'user',
            'created_by'
        ]
