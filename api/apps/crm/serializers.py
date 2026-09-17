from rest_framework import serializers

from apps.crm.models import Lead
from apps.users.serializers import SimpleUserSerializer


class LeadSerializer(serializers.ModelSerializer):
    manager = SimpleUserSerializer(read_only=True)
    manager_id = serializers.PrimaryKeyRelatedField(
        queryset=Lead.objects.all(),
        source='manager',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ('id',)
