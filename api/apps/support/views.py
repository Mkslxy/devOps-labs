from django.db import transaction
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, permissions
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.core.utils import HasPermission, CustomPageNumberPagination, IsOwnerOrHasCustomPermission
from apps.crm.models import Lead
from apps.crm.serializers import LeadSerializer
from apps.support.filters import CallbackRequestFilterSet, FeedbackFilterSet
from apps.support.models import CallbackRequest
from apps.support.models.callback_request import RequestStatus
from apps.support.models.feedback import Feedback
from apps.support.serializers import CallbackRequestSerializer, FeedbackSerializer


@extend_schema(tags=["Leads/CallbackRequest"])
class CallbackRequestViewSet(viewsets.ModelViewSet):
    queryset = CallbackRequest.objects.all()
    serializer_class = CallbackRequestSerializer

    permission_classes = [HasPermission]
    pagination_class = CustomPageNumberPagination

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = CallbackRequestFilterSet
    ordering_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()

    def get_required_permissions(self, request):
        if self.request.method not in permissions.SAFE_METHODS:
            return ['callback-request.read', 'callback-request.write']
        return ['callback-request.read']

    @extend_schema(responses={200: LeadSerializer})
    @action(detail=True, methods=["post"], url_path="create-lead", serializer_class=None)
    @transaction.atomic
    def create_lead(self, request, pk=None):
        cbr = self.get_object()

        actor = request.user if request.user.is_authenticated else None

        if actor and actor.has_permission("callback-request.write"):
            cbr.processed_by = actor

        phone_normalized = None
        if cbr.phone_country_code and cbr.phone_national_number:
            phone_normalized = f"{cbr.phone_country_code}{cbr.phone_national_number}"

        lead_qs = Lead.objects.all()
        if cbr.email:
            lead_qs = lead_qs.filter(email=cbr.email)
        if phone_normalized:
            lead_qs = lead_qs.filter(phone=phone_normalized)
        if lead_qs.exists():
            return Response({"error": "Lead with this phone or email already exists."}, status=400)

        lead = Lead.objects.create(
            name=cbr.full_name,
            phone=phone_normalized,
            email=cbr.email,
            city=cbr.city,
            manager=actor,
            source=cbr.callback_page,
            status="new",
            notes=(cbr.message or ""),
        )

        cbr.converted_lead = lead
        cbr.status = RequestStatus.CONVERTED
        cbr.save(update_fields=["processed_by", "converted_lead", "status"])

        return Response(LeadSerializer(instance=lead).data, status=201)


@extend_schema(tags=['Feedback'])
class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    required_permissions = ['feedbacks.manage_all']

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = FeedbackFilterSet
    ordering_fields = ['id', 'created_at', 'rating']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            return [IsOwnerOrHasCustomPermission()]
        return [HasPermission()]
