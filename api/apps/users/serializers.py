import logging
logger = logging.getLogger(__name__)

from datetime import datetime
import random

from django.core.validators import RegexValidator
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.classes.models import School
from apps.core.email.tasks import send_email_task
from apps.users.models import User, EmailVerification, Role
from apps.users.models.user import Language
from apps.users.tokens import EmailVerificationToken
from apps.users.utils import generate_random_password


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, required=True)
    password_confirm = serializers.CharField(write_only=True, min_length=8, required=True)
    phone_country_code = serializers.CharField(
        max_length=5,
        validators=[RegexValidator(r'^\+[0-9]{1,3}$', message="Format: +380")]
    )
    phone_national_number = serializers.CharField(
        max_length=20,
        validators=[RegexValidator(r'^[0-9]{6,14}$', message="Digits only")]
    )
    verification_token = serializers.CharField(write_only=True)
    permissions = serializers.SlugRelatedField(
        source='role.permissions',
        many=True,
        read_only=True,
        slug_field='slug'
    )

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'full_name',
            'phone_country_code',
            'phone_national_number',
            'phone_normalized',
            'role',
            'city',
            'password',
            'password_confirm',
            'date_of_birth',
            'permissions',
            'groups',
            'schools',
            'verification_token'

        )
        read_only_fields = (
            'id',
            'phone_normalized',
            'role',
            'permissions',
            'groups',
            'schools'
        )

    def validate(self, attrs):
        token_str = attrs.get("verification_token")

        try:
            decoded = EmailVerificationToken(token_str)
        except Exception as e:
            raise ValidationError({"verification_token": f"Invalid or expired token | {e}"})
        if decoded.get("token_type") != "email_verification":
            raise ValidationError({"verification_token": "Wrong token type"})
        token_email = decoded.get("email")
        if not token_email or token_email.lower() != attrs["email"].lower():
            raise ValidationError({"verification_token": "Token does not match this email"})
        attrs.pop("verification_token")

        if attrs["password"] != attrs["password_confirm"]:
            raise ValidationError({"password": "Passwords didn't match."})
        attrs.pop("password_confirm")

        country_code = attrs.get("phone_country_code")
        national_number = attrs.get("phone_national_number")
        phone_normalized = f"{country_code}{national_number}"
        if User.objects.filter(phone_normalized=phone_normalized).exists():
            raise ValidationError({
                "phone": f"User with phone {phone_normalized} already exists."
            })
        attrs["phone_normalized"] = phone_normalized

        dob = attrs.get("date_of_birth")
        if dob and dob > datetime.now().date():
            raise ValidationError({"date_of_birth": "Date of birth cannot be in the future."})

        return attrs

    def create(self, validated_data):

        user = User.objects.create_user(**validated_data)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user: User):
        token = super().get_token(user)

        token['role'] = user.role.slug if user.role else None
        token['full_name'] = user.full_name
        token['email'] = user.email

        return token


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ('id', 'slug', 'name')
        read_only_fields = ('id', 'slug', 'name')


class UserSerializer(serializers.ModelSerializer):
    phone_country_code = serializers.CharField(
        max_length=5,
        validators=[RegexValidator(r'^\+[0-9]{1,3}$', message="Format: +380")]
    )
    phone_national_number = serializers.CharField(
        max_length=20,
        validators=[RegexValidator(r'^[0-9]{6,14}$', message="Digits only")]
    )
    permissions = serializers.SlugRelatedField(
        source='role.permissions',
        many=True,
        read_only=True,
        slug_field='slug'
    )
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        write_only=True,
        required=False
    )

    schools = serializers.SerializerMethodField()
    school_ids = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(),
        many=True,
        write_only=True,
        required=False
    )

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'full_name',
            'phone_country_code',
            'phone_national_number',
            'phone_normalized',
            'role',
            'city',
            'date_of_birth',
            'permissions',
            'groups',
            'schools', 'school_ids',
            'is_google_calendar_connected',
            'role_id'
        )
        read_only_fields = (
            'id',
            'phone_normalized',
            'role',
            'permissions',
            'is_google_calendar_connected',
            'groups',
            'schools'
        )

    def get_schools(self, obj):
        from apps.classes.serializers import SchoolSerializer
        return SchoolSerializer(obj.schools.all(), many=True).data

    def validate(self, attrs):
        request = self.context.get('request')
        if request and self.instance and self.instance == request.user:
            raise serializers.ValidationError("You cannot edit your own data through this endpoint.")
        return attrs

    def create(self, validated_data):
        password = generate_random_password()
        validated_data['password'] = password

        validated_data['phone_normalized'] = (
            f"{validated_data['phone_country_code']}"
            f"{validated_data['phone_national_number']}"
        )


        school_ids = validated_data.pop('school_ids', [])
        user = User.objects.create_user(**validated_data)

        if school_ids:
            user.schools.set(school_ids)

        send_email_task.delay(
            subject='Вас зареєстровано в системі!',
            message=f"Ось ваш пароль: {password}",
            recipient_list=(user.email,),
        )

        return user

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)

        school_ids = validated_data.pop('school_ids', None)
        if school_ids is not None:
            instance.schools.set(school_ids)

        country_code = validated_data.get('phone_country_code', instance.phone_country_code)
        national_number = validated_data.get('phone_national_number', instance.phone_national_number)
        instance.phone_normalized = f"{country_code}{national_number}"

        instance.save()
        return instance


class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'full_name',
            'phone_country_code',
            'phone_national_number',
            'phone_normalized',
            'city',
            'date_of_birth',
        )
        read_only_fields = fields


class OrgChartUserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone_normalized', 'role_name']


class ChangeLocalizationSerializer(serializers.Serializer):
    language = serializers.ChoiceField(choices=Language.choices)


class ResetCodeRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(help_text="Email користувача для відновлення пароля")


class CheckResetCodeRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(help_text="Email користувача")
    code = serializers.CharField(help_text="Код відновлення", max_length=6)


class ResetPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(help_text="Email користувача")
    code = serializers.CharField(help_text="Код відновлення", max_length=6)
    password = serializers.CharField(help_text="Новий пароль", min_length=8)
    repeat_password = serializers.CharField(help_text="Повтор пароля", min_length=8)


class SendEmailCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def create_code(self):
        email = self.validated_data['email']

        user = User.objects.filter(email=email)
        if user.exists():
            raise ValidationError({"email": "Email already registered."})

        code = f"{random.randint(100000, 999999)}"

        EmailVerification.objects.filter(email=email).delete()
        EmailVerification.objects.create(email=email, code=code)

        send_email_task.delay(
            subject='Підтвердження пошти',
            message=f"Ось ваш код для підтвердження пошти: {code}",
            recipient_list=[email],
        )

        return code


class VerifyEmailCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs['email']
        code = attrs['code']

        try:
            obj = EmailVerification.objects.get(email=email)
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError({"code": "Code not found"})

        if obj.is_expired():
            raise serializers.ValidationError({"code": "Code expired"})

        if obj.code != code:
            raise serializers.ValidationError({"code": "Invalid code"})

        return attrs

    def create_token(self):
        email = self.validated_data["email"]

        token = EmailVerificationToken()
        token['email'] = email
        return str(token)
