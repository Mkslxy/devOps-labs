from datetime import date, timedelta

import pytest

from apps.finance.models import Payment, PaymentStatus, StudentSubscription, SubscriptionPlan
from apps.finance.models.pnl.currency import Currency
from apps.finance.models.student_subsctiption import SubscriptionStatus


@pytest.mark.django_db
def test_payment_unit_generates_order_reference(admin_user):
    payment = Payment.objects.create(
        user=admin_user,
        amount="499.00",
        currency="UAH",
        status=PaymentStatus.PENDING,
    )

    assert payment.order_reference.startswith("SUB-")
    assert payment.status == PaymentStatus.PENDING


@pytest.mark.django_db
def test_subscription_integration_active_subscription_is_valid(student_user):
    currency = Currency.objects.create(code="UAH", name="Hryvnia", symbol="UAH")
    plan = SubscriptionPlan.objects.create(
        name="Stage 4 Plan",
        lessons_count=8,
        duration_days=30,
        grace_period_days=3,
        price="2400.00",
        currency=currency,
        is_active=True,
    )
    subscription = StudentSubscription.objects.create(
        student=student_user,
        plan=plan,
        status=SubscriptionStatus.ACTIVE,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        lessons_remaining=8,
    )

    assert subscription.is_valid is True
    assert subscription.is_expired is False
