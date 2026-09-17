from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import SAFE_METHODS
from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import OrderingFilter

from apps.core.utils import HasPermission, CustomPageNumberPagination
from apps.crm.filters import LeadFilterSet
from apps.crm.models import Lead
from apps.crm.serializers import LeadSerializer

@extend_schema(tags=['Leads/Lead'])
class LeadViewSet(ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer

    permission_classes = [HasPermission]
    pagination_class = CustomPageNumberPagination

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = LeadFilterSet
    ordering_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_required_permissions(self, request):
        if request.method not in SAFE_METHODS:
            return ['leads.read', 'leads.write']
        return ['leads.read']
