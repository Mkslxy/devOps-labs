from django.urls import path, include
from rest_framework import routers

from apps.finance.views import CategoryViewSet, SubCategoryViewSet, PaymentMethodViewSet, TransactionViewSet, \
    CurrencyViewSet, SubscriptionPlanViewSet, StudentSubscriptionViewSet, CreateInvoiceView, WayForPayCallbackView, \
    WayForPayRedirectView, CreateTopUpInvoiceView, CreateGiftInvoiceView, DebtorsViewSet, PaymentCalendarViewSet, \
    SchoolBalanceViewSet, CompanyBalanceViewSet, CreateCourseInvoiceView

pnl_router = routers.DefaultRouter()
pnl_router.register('category', CategoryViewSet, basename='category')
pnl_router.register('subcategory', SubCategoryViewSet, basename='subcategory')
pnl_router.register('payment-method', PaymentMethodViewSet, basename='payment-method')
pnl_router.register('currency', CurrencyViewSet, basename='currency')
pnl_router.register('transaction', TransactionViewSet, basename='transaction')
pnl_router.register('balance/school', SchoolBalanceViewSet, basename='school-balance')
pnl_router.register('balance/company', CompanyBalanceViewSet, basename='company-balance')

subs_router = routers.DefaultRouter()
subs_router.register('sub-plan', SubscriptionPlanViewSet, basename='sub-plan')
subs_router.register('student-sub', StudentSubscriptionViewSet, basename='student-sub')

# urls.py
money_router = routers.DefaultRouter()
money_router.register('debtors', DebtorsViewSet, basename='debtors')
money_router.register('payment-calendar', PaymentCalendarViewSet, basename='payment-calendar')

urlpatterns = [
    path('pnl/', include(pnl_router.urls)),
    path('', include(subs_router.urls)),
    path('payments/', include(money_router.urls)),

    path('payments/create-invoice/', CreateInvoiceView.as_view(), name='create-invoice'),
    path('payments/create-top-up-invoice/', CreateTopUpInvoiceView.as_view(), name='create-top-up-invoice'),
    path('payments/create-gift-invoice/', CreateGiftInvoiceView.as_view(), name='create-gift-invoice'),
    path('payments/create-course-invoice/', CreateCourseInvoiceView.as_view(), name='create-course-invoice'),
    path('payments/wfp/callback/', WayForPayCallbackView.as_view(), name='wfp-callback'),
    path('payments/wfp/redirect/', WayForPayRedirectView.as_view(), name='wfp-redirect'),

]
