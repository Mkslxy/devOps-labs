from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from apps.classes.models import Group, GroupStudent, School
from apps.classes.serializers import SimpleGroupSerializer, SchoolSerializer
from apps.courses.models import Course
from apps.courses.serializers import CourseSerializer
from apps.finance.models import Category, SubCategory, PaymentMethod, Transaction, Currency, SubscriptionPlan, \
    StudentSubscription, Payment, SchoolBalance, CompanyBalance
from apps.finance.models.student_subsctiption import SubscriptionStatus
from apps.finance.services import PnlService
from apps.gradebook.models import Attendance
from apps.gradebook.models.attendence import AttendanceCategory
from apps.users.models import User
from apps.users.serializers import SimpleUserSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ('id',)


class SubCategorySerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source='category',
        queryset=Category.objects.all(),
        write_only=True
    )

    class Meta:
        model = SubCategory
        fields = '__all__'
        read_only_fields = ('id',)


class SimpleSubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ('id', 'name')
        read_only_fields = ('id',)


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = '__all__'
        read_only_fields = ('id',)


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = '__all__'
        read_only_fields = ('id',)


class TransactionSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    subcategory = SimpleSubCategorySerializer(read_only=True)
    payment_method = PaymentMethodSerializer(read_only=True)
    currency = CurrencySerializer(read_only=True)
    school = SchoolSerializer(read_only=True)

    category_id = serializers.PrimaryKeyRelatedField(
        source='category',
        queryset=Category.objects.all(),
        write_only=True
    )
    subcategory_id = serializers.PrimaryKeyRelatedField(
        source='subcategory',
        queryset=SubCategory.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    payment_method_id = serializers.PrimaryKeyRelatedField(
        source='payment_method',
        queryset=PaymentMethod.objects.all(),
        write_only=True
    )
    currency_id = serializers.PrimaryKeyRelatedField(
        source='currency',
        queryset=Currency.objects.all(),
        write_only=True
    )
    school_id = serializers.PrimaryKeyRelatedField(
        source='school',
        queryset=School.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ('id',)

    def validate(self, data):
        category = data.get('category') or getattr(self.instance, 'category', None)
        subcategory = data.get('subcategory') or getattr(self.instance, 'subcategory', None)
        if subcategory and category and subcategory.category != category:
            raise ValidationError({"subcategory_id": "Subcategory should be a child of the given category."})
        return data

    def create(self, validated_data):
        amount = validated_data.pop('amount')
        txn_type = validated_data.pop('type')
        currency = validated_data.pop('currency')
        school = validated_data.pop('school', None)

        return PnlService.create_transaction(
            amount=amount,
            type_=txn_type,
            currency=currency,
            school=school,
            **validated_data
        )

    def update(self, instance, validated_data):
        return PnlService.update_transaction(instance, **validated_data)


class SchoolBalanceSerializer(serializers.ModelSerializer):
    school = SchoolSerializer()
    currency = CurrencySerializer()

    class Meta:
        model = SchoolBalance
        fields = '__all__'


class CompanyBalanceSerializer(serializers.ModelSerializer):
    currency = CurrencySerializer()

    class Meta:
        model = CompanyBalance
        fields = '__all__'


### ### ### ###
### SUB PLANS
### ### ### ###
class SubscriptionPlanSerializer(serializers.ModelSerializer):
    currency = CurrencySerializer(read_only=True)
    currency_id = serializers.PrimaryKeyRelatedField(
        source='currency',
        queryset=Currency.objects.all(),
        write_only=True,
        required=True
    )
    currency_value = serializers.IntegerField(
        source='currency.id',
        read_only=True
    )

    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        source='course',
        queryset=Course.objects.all(),
        write_only=True,
        required=False
    )
    course_value = serializers.IntegerField(
        source='course.id',
        read_only=True
    )

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id',
            'name',
            'description',
            'lessons_count',
            'duration_days',
            'grace_period_days',
            'price',
            'price_per_lesson',

            'currency',
            'currency_id',
            'currency_value',

            'course',
            'course_id',
            'course_value',

            'lesson_type',
            'is_active',
            'created_at',
            'updated_at',
        ]

class StudentSubscriptionSerializer(serializers.ModelSerializer):
    student = SimpleUserSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        source='student',
        queryset=User.objects.all(),
        write_only=True,
        required=True
    )

    plan = SubscriptionPlanSerializer(read_only=True)
    plan_id = serializers.PrimaryKeyRelatedField(
        source='plan',
        queryset=SubscriptionPlan.objects.all(),
        write_only=True,
        required=True
    )

    group = SimpleGroupSerializer(read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(
        source='group',
        queryset=Group.objects.all(),
        write_only=True,
        required=True
    )

    class Meta:
        model = StudentSubscription
        fields = [
            'id',
            'student', 'student_id',
            'lessons_remaining',
            'plan', 'plan_id',
            'group', 'group_id',
            'status',
            'start_date', 'end_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id',
            'created_at', 'updated_at',
        ]


class ActivateStudentSubscriptionSerializer(serializers.ModelSerializer):
    group_id = serializers.PrimaryKeyRelatedField(
        source='group',
        queryset=Group.objects.all(),
        write_only=True,
        required=True
    )

    class Meta:
        model = StudentSubscription
        fields = ['group_id']

    def validate(self, data):
        instance: StudentSubscription = self.instance

        if instance.status != SubscriptionStatus.PENDING_ASSIGNMENT:
            raise ValidationError({"message": f"Cannot activate subscription with status '{instance.status}'."})

        return data


class CreateInvoiceSerializer(serializers.Serializer):
    plan_id = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionPlan.objects.all(),
        write_only=True,
        required=True
    )

    def validate(self, data):
        plan: SubscriptionPlan = data.get('plan_id')

        if not plan.is_active:
            raise ValidationError({"plan_id": "Cannot create invoice for inactive subscription plan."})

        return data


class TopUpInvoiceSerializer(serializers.Serializer):
    subscription_id = serializers.IntegerField()
    lessons_count = serializers.IntegerField(min_value=1)


class GiftInvoiceSerializer(serializers.Serializer):
    issued_to_email = serializers.EmailField(required=True)
    issued_to_name = serializers.CharField(required=True)

    purchaser_name = serializers.CharField(required=False)
    purchaser_email = serializers.EmailField(required=False)

    plan = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionPlan.objects.filter(is_active=True),
        write_only=True,
        required=True
    )

    def validate(self, data):
        request = self.context.get('request')
        is_guest = not (request and request.user and request.user.is_authenticated)
        if is_guest:
            if not data.get('purchaser_email') or not data.get('purchaser_name'):
                raise ValidationError("Should be authenticated or pass email and name.")

        else:
            data['purchaser'] = request.user

            if not data.get('purchaser_email'):
                data['purchaser_email'] = request.user.email

            if not data.get('purchaser_name'):
                data['purchaser_name'] = getattr(request.user, 'full_name', request.user.email)

        return data


class CourseInvoiceSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()

    def validate_course_id(self, value):
        try:
            course = Course.objects.get(id=value)
            if not course.is_sellable or course.price <= 0:
                raise serializers.ValidationError("This course is not sellable.")
            return course
        except Course.DoesNotExist:
            raise serializers.ValidationError("Course does not exist.")


class CreateInvoiceResponseSerializer(serializers.Serializer):
    invoiceUrl = serializers.CharField(help_text="https://secure.wayforpay.com/invoice/i33ec40eac07b")
    reason = serializers.CharField(help_text="Ok")
    reasonCode = serializers.IntegerField(help_text="1100")
    qrCode = serializers.CharField(help_text="https://wayforpay.com/qr/img/i33ec40eac07b?type=i&size=200")


class RedeemGiftCertificateSerializer(serializers.Serializer):
    code = serializers.CharField(required=True, max_length=50)


### борги
class DebtorListSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source='student.id', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    plan_name = serializers.SerializerMethodField()
    debt_amount = serializers.SerializerMethodField()
    overdue_days = serializers.SerializerMethodField()
    unpaid_lessons_count = serializers.SerializerMethodField()

    class Meta:
        model = GroupStudent
        fields = [
            'student_id', 'student_name', 'group_id', 'group_name',
            'plan_name', 'debt_amount', 'overdue_days', 'unpaid_lessons_count'
        ]

    def _get_last_subscription(self, obj):
        if not hasattr(obj, '_last_sub'):
            obj._last_sub = obj.student.subscriptions.filter(
                group=obj.group
            ).order_by('-end_date', '-created_at').first()
        return obj._last_sub

    @extend_schema_field(OpenApiTypes.STR)
    def get_plan_name(self, obj):
        sub = self._get_last_subscription(obj)
        return sub.plan.name if sub and sub.plan else "Немає тарифу"

    @extend_schema_field(OpenApiTypes.DECIMAL)  # Або FLOAT, залежно від твого поля price
    def get_debt_amount(self, obj):
        sub = self._get_last_subscription(obj)
        return sub.plan.price if sub and sub.plan else 0

    @extend_schema_field(OpenApiTypes.INT)
    def get_overdue_days(self, obj):
        sub = self._get_last_subscription(obj)
        if sub and sub.end_date:
            days = (timezone.now().date() - sub.end_date).days
            return days if days > 0 else 0
        return 0

    @extend_schema_field(OpenApiTypes.INT)
    def get_unpaid_lessons_count(self, obj):
        sub = self._get_last_subscription(obj)

        if sub and sub.lessons_remaining is not None and sub.lessons_remaining < 0:
            return abs(sub.lessons_remaining)

        if not sub:
            return Attendance.objects.filter(
                student=obj.student,
                column__group=obj.group,
                category__in=[AttendanceCategory.PRESENT, AttendanceCategory.LATE]
            ).count()

        return 0


class PaymentCalendarSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source='user.id', read_only=True)
    student_name = serializers.CharField(source='user.full_name', read_only=True)

    plan_name = serializers.CharField(source='plan.name', read_only=True, allow_null=True)
    group_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'order_reference', 'amount', 'currency', 'closed_at',
            'student_id', 'student_name', 'plan_name', 'group_name', 'payment_type'
        ]

    def get_group_name(self, obj):
        if getattr(obj, 'target_subscription', None) and obj.target_subscription.group:
            return obj.target_subscription.group.name

        if getattr(obj, 'plan', None) and getattr(obj, 'user', None):
            sub = obj.user.subscriptions.filter(plan=obj.plan).order_by('-created_at').first()
            if sub and sub.group:
                return sub.group.name

        return "Не призначено / Очікує"

