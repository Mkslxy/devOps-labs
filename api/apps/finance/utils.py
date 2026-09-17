from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from UniSchool import settings
from apps.finance.models import StudentSubscription, Category, Payment, SubCategory, PaymentMethod, \
    TransactionType, Currency
from apps.finance.models.payment import PaymentType
from apps.finance.models.student_subsctiption import SubscriptionStatus
from apps.finance.services import PnlService
from apps.gradebook.models.attendence import AttendanceCategory, Attendance


def build_invoice_payload(payment):
    plan = payment.plan
    user = payment.user

    # ДЛЯ ПРОДУ
    # amount = float(payment.amount)
    # currency = payment.currency

    # ТЕСТ ДАНІ
    amount = 1
    currency = "UAH"

    payment_type = getattr(payment, 'payment_type', 'new_sub')
    if payment_type == 'top_up':
        product_names = [f"Додаткові заняття ({payment.extra_lessons} шт.) - {plan.name}"]
    elif payment_type == 'course':
        product_names = [payment.target_course.title]
    else:
        product_names = [plan.name]

    client_email = payment.user.email if payment.user else payment.guest_email

    product_prices = [amount]
    product_counts = [1]

    payload = {
        "orderReference": payment.order_reference,
        "orderDate": int(timezone.now().timestamp()),
        "amount": amount,
        "currency": currency,
        "orderTimeout": getattr(settings, 'PAYMENT_TIME', 24) * 3600,
        "productName": product_names,
        "productPrice": product_prices,
        "productCount": product_counts,
        "clientEmail": client_email,
        "serviceUrl": f"{settings.WFP_MERCHANT_DOMAIN}/payments/wfp/callback/",
        "returnUrl": f"{settings.WFP_MERCHANT_DOMAIN}/payments/wfp/redirect/"
    }

    return payload


def deduct_lessons_for_group(lesson):
    if not lesson.grade_column:
        return []

    chargeable_student_ids = Attendance.objects.filter(
        column=lesson.grade_column,
        category__in=[AttendanceCategory.PRESENT, AttendanceCategory.LATE]
    ).values_list('student_id', flat=True)

    if not chargeable_student_ids:
        return []

    with transaction.atomic():
        active_subscriptions = StudentSubscription.objects.select_for_update().filter(
            student_id__in=chargeable_student_ids,
            group_id=lesson.group_id,
            status=SubscriptionStatus.ACTIVE
        ).order_by('end_date')

        subs_to_update = {}
        processed_student_ids = set()

        for sub in active_subscriptions:
            if sub.student_id in processed_student_ids:
                continue

            if sub.is_expired:
                sub.status = SubscriptionStatus.COMPLETED
                subs_to_update[sub.id] = sub
                continue

            if sub.lessons_remaining is not None:
                sub.lessons_remaining -= 1

            subs_to_update[sub.id] = sub
            processed_student_ids.add(sub.student_id)

        debtors = set(chargeable_student_ids) - processed_student_ids
        if debtors:
            last_subs = StudentSubscription.objects.filter(
                student_id__in=debtors,
                group=lesson.group
            ).order_by('student_id', '-end_date').distinct('student_id')

            for sub in last_subs:
                target_sub = subs_to_update.get(sub.id, sub)

                if target_sub.lessons_remaining is not None:
                    target_sub.lessons_remaining -= 1

                subs_to_update[target_sub.id] = target_sub

        if subs_to_update:
            StudentSubscription.objects.bulk_update(
                subs_to_update.values(),
                ['lessons_remaining', 'status']
            )

        return list(debtors)


def create_pnl_payment_record(payment: Payment):
    ptype = payment.payment_type

    currency_obj, _ = Currency.objects.get_or_create(
        code=payment.currency,
        defaults={'name': payment.currency}
    )

    category, _ = Category.objects.get_or_create(name="Абонементи")
    pmethod, _ = PaymentMethod.objects.get_or_create(name="WayForPay")
    if ptype == PaymentType.NEW_SUBSCRIPTION:
        subcat, _ = SubCategory.objects.get_or_create(category=category, name="Покупка абонементу")
    elif ptype == PaymentType.TOP_UP:
        subcat, _ = SubCategory.objects.get_or_create(category=category, name="Поповнення абонементу")
    elif ptype == PaymentType.COURSE:
        subcat, _ = SubCategory.objects.get_or_create(category=category, name="Поповнення курсу")
    else:
        subcat, _ = SubCategory.objects.get_or_create(category=category, name="Подарунковий сертифікат")

    PnlService.create_transaction(
        amount=payment.amount,
        type_=TransactionType.INCOME,
        category=category,
        subcategory=subcat,
        payment_method=pmethod,
        currency=currency_obj,
        school=None
    )
