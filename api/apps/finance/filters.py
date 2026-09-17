import django_filters
from django.db.models import Q

from apps.finance.models import Category, SubCategory, PaymentMethod, Transaction, TransactionType, Currency, \
    SubscriptionPlan, StudentSubscription, Payment, SchoolBalance, CompanyBalance


class CategoryFilterSet(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')

    class Meta:
        model = Category
        fields = ['name']


class SubCategoryFilterSet(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')

    class Meta:
        model = SubCategory
        fields = ['name', 'category']


class PaymentMethodFilterSet(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')

    class Meta:
        model = PaymentMethod
        fields = ['name']


class CurrencyFilterSet(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')
    code = django_filters.CharFilter(field_name='code', lookup_expr='icontains')

    class Meta:
        model = Currency
        fields = ['name', 'code']


class TransactionFilter(django_filters.FilterSet):
    amount = django_filters.RangeFilter()
    currency_code = django_filters.CharFilter(field_name='currency__code')
    description = django_filters.CharFilter(lookup_expr='icontains')

    updated_at = django_filters.IsoDateTimeFromToRangeFilter()
    created_at = django_filters.IsoDateTimeFromToRangeFilter()

    class Meta:
        model = Transaction
        fields = ['type', 'category', 'subcategory', 'payment_method', 'currency', 'school']


class SchoolBalanceFilter(django_filters.FilterSet):
    balance = django_filters.RangeFilter()

    class Meta:
        model = SchoolBalance
        fields = ['school', 'currency']


class CompanyBalanceFilter(django_filters.FilterSet):
    balance = django_filters.RangeFilter()

    class Meta:
        model = CompanyBalance
        fields = ['currency']


class SubscriptionPlanFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_by_search')

    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    min_lessons = django_filters.NumberFilter(field_name='lessons_count', lookup_expr='gte')
    max_lessons = django_filters.NumberFilter(field_name='lessons_count', lookup_expr='lte')

    class Meta:
        model = SubscriptionPlan
        fields = ['course', 'lesson_type', 'is_active', 'currency']

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value) |
            Q(description__icontains=value)
        )


class StudentSubscriptionFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_by_search')

    start_date = django_filters.DateFromToRangeFilter()
    end_date = django_filters.DateFromToRangeFilter()

    min_lessons = django_filters.NumberFilter(field_name='lessons_remaining', lookup_expr='gte')
    max_lessons = django_filters.NumberFilter(field_name='lessons_remaining', lookup_expr='lte')

    course = django_filters.NumberFilter(field_name='plan__course')

    class Meta:
        model = StudentSubscription
        fields = ['status', 'student', 'plan', 'group']

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(student__full_name__icontains=value) |
            Q(student__email__icontains=value) |
            Q(plan__name__icontains=value)
        )


class PaymentCalendarFilter(django_filters.FilterSet):
    closed_at = django_filters.DateFromToRangeFilter()

    search = django_filters.CharFilter(method='filter_by_search')

    class Meta:
        model = Payment
        fields = ['payment_type']

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            Q(user__full_name__icontains=value) |
            Q(user__email__icontains=value) |
            Q(order_reference__icontains=value)
        )
