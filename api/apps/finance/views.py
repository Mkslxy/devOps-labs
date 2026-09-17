import logging
logger = logging.getLogger(__name__)

import json
from datetime import timedelta

from django.db import transaction
from django.db.models import Prefetch, Case, When, Q
from django.shortcuts import redirect
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_excel.renderers import XLSXRenderer
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from rest_framework import permissions, views
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from UniSchool import settings
from apps.classes.models import GroupStudent
from apps.classes.models.group_student import GroupStudentStatus
from apps.core.email.tasks import send_email_task
from apps.core.mixins import ExportViewSetMixin
from apps.core.utils import HasPermission
from apps.finance.WayForPay import WayForPay
from apps.finance.filters import PaymentMethodFilterSet, TransactionFilter, SubCategoryFilterSet, CategoryFilterSet, \
    CurrencyFilterSet, SubscriptionPlanFilterSet, StudentSubscriptionFilterSet, PaymentCalendarFilter, \
    SchoolBalanceFilter, CompanyBalanceFilter
from apps.finance.models import Category, SubCategory, PaymentMethod, Transaction, Currency, SubscriptionPlan, \
    StudentSubscription, Payment, PaymentStatus, GiftCertificate, SchoolBalance, CompanyBalance
from apps.finance.models.payment import PaymentType
from apps.finance.models.student_subsctiption import SubscriptionStatus
from apps.finance.serializers import CategorySerializer, SubCategorySerializer, PaymentMethodSerializer, \
    TransactionSerializer, CurrencySerializer, SubscriptionPlanSerializer, StudentSubscriptionSerializer, \
    ActivateStudentSubscriptionSerializer, CreateInvoiceSerializer, CreateInvoiceResponseSerializer, \
    TopUpInvoiceSerializer, GiftInvoiceSerializer, DebtorListSerializer, PaymentCalendarSerializer, \
    SchoolBalanceSerializer, CompanyBalanceSerializer, CourseInvoiceSerializer
from apps.finance.services import PnlService
from apps.finance.utils import build_invoice_payload, create_pnl_payment_record

DAYS_TO_EXPIRE = 30


class PNLPermissionMixin:
    def get_required_permissions(self, view):
        if self.request.method not in permissions.SAFE_METHODS:
            return ['pnl.read', 'pnl.write']
        return ['pnl.read']


@extend_schema(tags=['PNL/Category'])
class CategoryViewSet(PNLPermissionMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    permission_classes = [IsAuthenticated, HasPermission]

    filter_backends = (DjangoFilterBackend, OrderingFilter)
    filterset_class = CategoryFilterSet
    ordering_fields = ['id', 'name']
    ordering = ['name']

    def get_queryset(self):
        return Category.objects.prefetch_related('subcategories').all()


@extend_schema(tags=['PNL/Subcategory'])
class SubCategoryViewSet(PNLPermissionMixin, viewsets.ModelViewSet):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer

    permission_classes = [IsAuthenticated, HasPermission]

    filter_backends = (DjangoFilterBackend, OrderingFilter)
    filterset_class = SubCategoryFilterSet
    ordering_fields = ['id', 'name']
    ordering = ['name']

    def get_queryset(self):
        return SubCategory.objects.select_related('category').all()


@extend_schema(tags=['PNL/Payment Method'])
class PaymentMethodViewSet(PNLPermissionMixin, viewsets.ModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer

    permission_classes = [IsAuthenticated, HasPermission]

    filter_backends = (DjangoFilterBackend, OrderingFilter)
    filterset_class = PaymentMethodFilterSet
    ordering_fields = ['id', 'name']
    ordering = ['name']


@extend_schema(tags=['PNL/Currency'])
class CurrencyViewSet(PNLPermissionMixin, viewsets.ModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer

    permission_classes = [IsAuthenticated, HasPermission]

    filter_backends = (DjangoFilterBackend, OrderingFilter)
    filterset_class = CurrencyFilterSet
    ordering_fields = ['id', 'code', 'name']
    ordering = ['name']


@extend_schema(tags=['PNL/Transaction'])
class TransactionViewSet(PNLPermissionMixin, viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    queryset = Transaction.objects.all()

    permission_classes = [IsAuthenticated, HasPermission]

    filter_backends = (DjangoFilterBackend, OrderingFilter)
    filterset_class = TransactionFilter
    ordering_fields = ['amount', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return Transaction.objects.select_related(
            'category',
            'subcategory',
            'payment_method',
            'currency',
            'school'
        ).all()

    def perform_destroy(self, instance):
        PnlService.delete_transaction(instance)


@extend_schema(tags=['PNL/SchoolBalance'])
class SchoolBalanceViewSet(PNLPermissionMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = SchoolBalanceSerializer
    queryset = SchoolBalance.objects.all()

    permission_classes = [IsAuthenticated, HasPermission]

    filter_backends = (DjangoFilterBackend, OrderingFilter)
    filterset_class = SchoolBalanceFilter
    ordering_fields = ['id', 'created_at', 'updated_at', 'school__name']
    ordering = ['-created_at']

    def get_required_permissions(self, view):
        if self.action == 'export':
            return ['pnl.read', 'excel.export']
        return ['pnl.read']

    def get_queryset(self):
        return SchoolBalance.objects.select_related(
            'school',
            'currency',
        ).all()


@extend_schema(tags=['PNL/CompanyBalance'])
class CompanyBalanceViewSet(PNLPermissionMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = CompanyBalanceSerializer
    queryset = CompanyBalance.objects.all()

    permission_classes = [IsAuthenticated, HasPermission]

    filter_backends = (DjangoFilterBackend, OrderingFilter)
    filterset_class = CompanyBalanceFilter
    ordering_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_required_permissions(self, view):
        if self.action == 'export':
            return ['pnl.read', 'excel.export']
        return ['pnl.read']

    def get_queryset(self):
        return CompanyBalance.objects.select_related(
            'currency',
        ).all()

    @action(methods=['GET'], detail=False, url_path='export', renderer_classes=[XLSXRenderer])
    def export(self, request, *args, **kwargs):
        flat_data = []

        company_balances = CompanyBalance.objects.select_related('currency').all()
        for cb in company_balances:
            flat_data.append({
                'wallet_type': 'Головний офіс',
                'entity_name': 'Головна каса компанії',
                'currency_code': cb.currency.code if cb.currency else '-',
                'balance': cb.balance,
                'updated_at': cb.updated_at
            })

        school_balances = SchoolBalance.objects.select_related('school', 'currency').all()
        for sb in school_balances:
            flat_data.append({
                'wallet_type': 'Філія',
                'entity_name': sb.school.name if sb.school else 'Невідома школа',
                'currency_code': sb.currency.code if sb.currency else '-',
                'balance': sb.balance,
                'updated_at': sb.updated_at
            })

        flat_data.sort(key=lambda x: (x['wallet_type'], x['entity_name']))

        serializer = self.get_serializer(flat_data, many=True)

        filename = f"combined_balances_{timezone.now().strftime('%Y%m%d_%H%M')}.xlsx"
        return Response(
            serializer.data,
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )


@extend_schema(tags=['Subscriptions/SubscriptionPlan'])
class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionPlanSerializer
    queryset = SubscriptionPlan.objects.all()
    required_permissions = ['subs.write']

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = SubscriptionPlanFilterSet
    ordering = ['-id']
    ordering_fields = ['price', 'id', 'name']

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [AllowAny()]
        return [HasPermission()]


@extend_schema(tags=['Subscriptions/StudentSubscription'])
class StudentSubscriptionViewSet(viewsets.ModelViewSet):
    queryset = StudentSubscription.objects.select_related('student', 'plan', 'group').all()
    serializer_class = StudentSubscriptionSerializer

    permission_classes = [HasPermission]
    required_permissions = ['subs.manage_all']

    filter_backends = (DjangoFilterBackend, OrderingFilter)
    filterset_class = StudentSubscriptionFilterSet
    ordering = ['-created_at']
    ordering_fields = ['created_at', 'updated_at', 'start_date', 'end_date', 'lessons_remaining']

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticated()]
        return [HasPermission()]

    def get_queryset(self):
        queryset = StudentSubscription.objects.select_related('student', 'plan', 'group').all()
        user = self.request.user

        if user.is_superuser or user.has_permission('subs.manage_all'):
            return queryset

        return queryset.filter(student=user)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        ssub: StudentSubscription = self.get_object()
        serializer = ActivateStudentSubscriptionSerializer(ssub, data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        plan = ssub.plan

        ssub.group = data['group']
        today = timezone.now().date()
        ssub.start_date = today
        ssub.end_date = today + timedelta(days=plan.duration_days)
        ssub.lessons_remaining = plan.lessons_count
        ssub.status = SubscriptionStatus.ACTIVE
        ssub.save()

        return Response(self.get_serializer(ssub).data, 200)


###
### WayForPay
###
wfp = WayForPay(
    account=settings.WFP_MERCHANT_ACCOUNT,
    domain=settings.WFP_MERCHANT_DOMAIN,
    key=settings.WFP_MERCHANT_SECRET_KEY,
)


@extend_schema(
    tags=["Finance"],
    request=CreateInvoiceSerializer,
    responses=CreateInvoiceResponseSerializer,
)
class CreateInvoiceView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = CreateInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan = serializer.validated_data["plan_id"]
        user = request.user

        try:
            with transaction.atomic():
                payment = Payment.objects.create(
                    plan=plan,
                    user=user,
                    amount=plan.price,
                    currency=plan.currency.code if plan.currency else 'UAH'
                )

                payload = build_invoice_payload(payment)

                invoice_data = wfp.create_invoice(data=payload)

            return Response(invoice_data, status=200)

        except ValueError as e:
            return Response({"error": "Payment gateway configuration error."}, status=500)
        except Exception as e:
            logger.error(f"WayForPay Error: {e}")
            return Response({"error": "Failed to create invoice."}, status=400)


@extend_schema(
    tags=["Finance"],
    request=TopUpInvoiceSerializer,
    responses=CreateInvoiceResponseSerializer,
)
class CreateTopUpInvoiceView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = TopUpInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        lessons_count = data['lessons_count']

        try:
            subscription = StudentSubscription.objects.get(
                id=data['subscription_id'],
                student=request.user,
                status=SubscriptionStatus.ACTIVE
            )
        except StudentSubscription.DoesNotExist:
            return Response({"error": "Active subscription not found."}, status=404)

        plan = subscription.plan
        if not plan.price_per_lesson:
            return Response({"error": "Top-up is not available for this plan."}, status=400)

        total_price = plan.price_per_lesson * lessons_count
        with transaction.atomic():
            payment = Payment.objects.create(
                plan=plan,
                user=request.user,
                amount=total_price,
                currency=plan.currency.code if plan.currency else 'UAH',
                payment_type=PaymentType.TOP_UP,
                target_subscription=subscription,
                extra_lessons=lessons_count
            )

            payload = build_invoice_payload(payment)

            invoice_data = wfp.create_invoice(data=payload)

        return Response(invoice_data, status=200)


@extend_schema(
    tags=["Finance"],
    request=GiftInvoiceSerializer,
    responses=CreateInvoiceResponseSerializer,
)
class CreateGiftInvoiceView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = GiftInvoiceSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        plan = data['plan']
        with transaction.atomic():
            gift = GiftCertificate.objects.create(
                plan=plan,
                amount=plan.price,

                purchaser=data.get('purchaser'),
                purchaser_name=data['purchaser_name'],
                purchaser_email=data['purchaser_email'],

                issued_to_email=data['issued_to_email'],
                issued_to_name=data['issued_to_name']
            )

            payment = Payment.objects.create(
                plan=plan,
                user=data.get('purchaser'),
                guest_email=data['purchaser_email'],
                amount=plan.price,
                currency=plan.currency.code if plan.currency else 'UAH',
                payment_type=PaymentType.GIFT,
                target_gift=gift
            )

            payload = build_invoice_payload(payment)

            invoice_data = wfp.create_invoice(data=payload)

        return Response(invoice_data, status=200)


@extend_schema(
    tags=["Finance"],
    request=CourseInvoiceSerializer,
    responses=CreateInvoiceResponseSerializer,
)
class CreateCourseInvoiceView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = CourseInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course = serializer.validated_data["course_id"]
        user = request.user

        try:
            with transaction.atomic():
                payment = Payment.objects.create(
                    user=user,
                    amount=course.price,
                    currency='UAH',
                    payment_type=PaymentType.COURSE,
                    target_course=course
                )

                payload = build_invoice_payload(payment)

                invoice_data = wfp.create_invoice(data=payload)

            return Response(invoice_data, status=200)

        except ValueError as e:
            return Response({"error": "Помилка конфігурації платіжного шлюзу."}, status=500)
        except Exception as e:
            logger.error(f"WayForPay Error (Course): {e}")
            return Response({"error": "Не вдалося створити інвойс."}, status=400)


@extend_schema(tags=["WFP"])
class WayForPayCallbackView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        raw_data = list(request.data.keys())[0]
        data = json.loads(raw_data)

        order_reference = data.get('orderReference')
        transaction_status = data.get('transactionStatus')
        reason_code = str(data.get('reasonCode', ''))

        if not order_reference:
            return Response({"error": "No orderReference"}, status=400)

        try:
            payment = Payment.objects.get(order_reference=order_reference)
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=404)

        if payment.status in [PaymentStatus.APPROVED, PaymentStatus.DECLINED]:
            return self._generate_wfp_response(order_reference)

        with transaction.atomic():
            payment.response_code = reason_code
            payment.closed_at = timezone.now()

            if transaction_status == 'Approved':
                payment.status = PaymentStatus.APPROVED
                payment.save()

                if payment.payment_type == PaymentType.NEW_SUBSCRIPTION:
                    StudentSubscription.objects.create(
                        student=payment.user,
                        plan=payment.plan,
                        status=SubscriptionStatus.PENDING_ASSIGNMENT
                    )
                elif payment.payment_type == PaymentType.TOP_UP:
                    sub = payment.target_subscription
                    if sub.lessons_remaining is not None:
                        sub.lessons_remaining += payment.extra_lessons
                    sub.save(update_fields=['lessons_remaining'])
                elif payment.payment_type == PaymentType.GIFT:
                    gift = payment.target_gift
                    gift.is_paid = True
                    gift.expires_at = timezone.now() + timedelta(days=DAYS_TO_EXPIRE)
                    gift.save(update_fields=['is_paid', 'expires_at'])

                    message = (f"Привіт, {gift.issued_to_name}!\n\n"
                               f"У нас попросили передати вам промокод {gift.code} на абонемент '{payment.plan.name}'.\n"
                               f"Не забудьте активувати його, адже через 30 днів його строк дії сплине!")
                    send_email_task.delay(
                        subject="Вам надіслали подарунок!",
                        message=message,
                        recipient_list=[gift.issued_to_email]
                    )

                create_pnl_payment_record(payment)
            else:
                payment.status = PaymentStatus.DECLINED
                payment.save()

        return self._generate_wfp_response(order_reference)

    def _generate_wfp_response(self, order_reference):
        current_time = int(timezone.now().timestamp())

        response_data = {
            "orderReference": order_reference,
            "status": "accept",
            "time": current_time
        }
        signature = wfp.get_answer_signature(response_data)
        response_data["signature"] = signature

        return Response(response_data, status=200)


@extend_schema(tags=["WFP"])
class WayForPayRedirectView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        return self._handle_redirect(request)

    def get(self, request, *args, **kwargs):
        return self._handle_redirect(request)

    def _handle_redirect(self, request):
        frontend_url = settings.FRONTEND_URL

        transaction_status = request.data.get('transactionStatus') or request.GET.get('transactionStatus')
        if transaction_status == 'Approved':
            return redirect(f"{frontend_url}/payment/success/")
        else:
            return redirect(f"{frontend_url}/payment/fail/")


### БОРГИ
@extend_schema_view(
    list=extend_schema(
        summary="Список боржників бро",
        description=(
            "Повертає список студентів із заборгованістю по оплаті.\n\n"
            "**Умови боргу:**\n"
            "* Від'ємний баланс уроків (`lessons_remaining < 0`)\n"
            "* Вичерпано час дії абонемента (`end_date < today`)\n"
            "* Студент навчається в групі, але ще не купив жодного абонемента. льошка бро"
        ),
        parameters=[
            OpenApiParameter(
                name='ordering',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Сортування. Оскільки поля динамічні, доступні ТІЛЬКИ ці значення. льошка бро",
                enum=['debt_amount', '-debt_amount', 'overdue_days', '-overdue_days'],
                required=False
            )
        ]
    )
)
@extend_schema(tags=["Payments"])
class DebtorsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DebtorListSerializer
    permission_classes = [HasPermission]
    required_permissions = ['debts.read']

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['group']

    def get_queryset(self):
        today = timezone.now().date()

        base_qs = GroupStudent.objects.filter(status=GroupStudentStatus.ACTIVE)

        group_id = self.request.query_params.get('group')
        if group_id:
            base_qs = base_qs.filter(group_id=group_id)

        search_query = self.request.query_params.get('search')
        if search_query:
            base_qs = base_qs.filter(
                Q(student__full_name__icontains=search_query) |
                Q(student__email__icontains=search_query)
            )

        base_qs = base_qs.select_related('student', 'group').prefetch_related(
            Prefetch(
                'student__subscriptions',
                queryset=StudentSubscription.objects.all().order_by('-end_date', '-created_at')
            )
        )

        debtors_data = []

        for gs in base_qs:
            group_subs = [s for s in gs.student.subscriptions.all() if s.group_id == gs.group_id]
            sub = group_subs[0] if group_subs else None

            has_negative_lessons = sub and sub.lessons_remaining is not None and sub.lessons_remaining < 0
            is_time_expired = sub and sub.end_date and sub.end_date < today
            no_sub_at_all = not sub

            if has_negative_lessons or is_time_expired or no_sub_at_all:
                debt_amount = sub.plan.price if sub and sub.plan else 0

                overdue_days = 0
                if sub and sub.end_date:
                    days = (today - sub.end_date).days
                    if days > 0:
                        overdue_days = days

                debtors_data.append({
                    'id': gs.id,
                    'debt_amount': debt_amount,
                    'overdue_days': overdue_days
                })

        if not debtors_data:
            return GroupStudent.objects.none()

        ordering = self.request.query_params.get('ordering')
        if ordering:
            is_reverse = ordering.startswith('-')
            sort_field = ordering.lstrip('-')

            if sort_field in ['debt_amount', 'overdue_days']:
                debtors_data.sort(key=lambda x: x[sort_field], reverse=is_reverse)

        sorted_ids = [item['id'] for item in debtors_data]

        preserved_order = Case(*[When(id=pk, then=pos) for pos, pk in enumerate(sorted_ids)])

        return GroupStudent.objects.filter(
            id__in=sorted_ids
        ).select_related('student', 'group').order_by(preserved_order)


@extend_schema(tags=["Payments"])
class PaymentCalendarViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentCalendarSerializer
    permission_classes = [HasPermission]
    required_permissions = ['payments.read']

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = PaymentCalendarFilter

    ordering_fields = ['closed_at', 'amount']
    ordering = ['-closed_at']

    def get_queryset(self):
        return Payment.objects.filter(
            status=PaymentStatus.APPROVED
        ).select_related(
            'user',
            'plan',
            'target_subscription__group'
        ).prefetch_related(
            'user__subscriptions__group'
        )
