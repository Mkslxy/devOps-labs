from django.utils import timezone
from drf_excel.renderers import XLSXRenderer
from rest_framework import serializers
from rest_framework.fields import ListField, FileField, IntegerField, JSONField
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema

from apps.core.services import sync_attachments


class CreatedByMixin:
    def _inject_created_by(self, validated_data):
        request = self.context.get('request')
        if request:
            validated_data.setdefault('created_by', request.user)

    def create(self, validated_data):
        self._inject_created_by(validated_data)
        return super().create(validated_data)


class FileAttachmentsManagerMixin(serializers.Serializer):
    uploaded_files = ListField(
        child=FileField(),
        write_only=True,
        required=False
    )
    deleted_file_ids = ListField(
        child=IntegerField(),
        write_only=True,
        required=False
    )


class LinkAttachmentsManagerMixin(serializers.Serializer):
    links_json = JSONField(
        write_only=True,
        required=False
    )
    deleted_link_ids = ListField(
        child=IntegerField(),
        write_only=True,
        required=False
    )


class FileLinkAttachmentsManagerMixin(FileAttachmentsManagerMixin, LinkAttachmentsManagerMixin):
    attachment_file_model = None
    attachment_link_model = None

    def _get_model(self, name):
        model = getattr(self, name, None)
        if not model:
            raise NotImplementedError(f"Please define '{name}' in {self.__class__.__name__}")
        return model

    def perform_pre_save(self, validated_data):
        pass

    def perform_pre_update(self, validated_data):
        pass

    def create(self, validated_data):
        validated_data.pop('deleted_file_ids', None)
        validated_data.pop('deleted_link_ids', None)

        uploaded_files = validated_data.pop('uploaded_files', [])
        links_data = validated_data.pop('links_json', [])

        self.perform_pre_save(validated_data)

        instance = super().create(validated_data)

        sync_attachments(
            document=instance,
            file_model=self._get_model('attachment_file_model'),
            uploaded_files=uploaded_files,
            deleted_file_ids=[],
            link_model=self._get_model('attachment_link_model'),
            links_data=links_data,
            deleted_link_ids=[],
        )

        return instance

    def update(self, instance, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        deleted_file_ids = validated_data.pop('deleted_file_ids', [])
        links_data = validated_data.pop('links_json', [])
        deleted_link_ids = validated_data.pop('deleted_link_ids', [])

        self.perform_pre_update(validated_data)

        instance = super().update(instance, validated_data)

        sync_attachments(
            document=instance,
            file_model=self._get_model('attachment_file_model'),
            uploaded_files=uploaded_files,
            deleted_file_ids=deleted_file_ids,
            link_model=self._get_model('attachment_link_model'),
            links_data=links_data,
            deleted_link_ids=deleted_link_ids,
        )
        return instance


class ExportViewSetMixin:
    export_serializer_classes: dict
    xlsx_use_labels = True

    body = {
        'style': {
            'alignment': {
                'vertical': 'center',
                'wrapText': True,
                'shrink_to_fit': True,
            },
            'border_side': {
                'border_style': 'thin',
                'color': '666666',
            },
            'font': {
                'bold': False,
                'color': 'FF000000',
            },
        },
        'height': 20
    }
    column_header = {
        'style': {
            'alignment': {
                'horizontal': 'center',
                'vertical': 'center',
                'wrapText': True,
                'shrink_to_fit': True,
            },
            'border_side': {
                'border_style': 'thin',
                'color': '666666',
            },
            'font': {
                'bold': True,
                'color': 'FF000000',
            },
        },
        'height': 20
    }

    def get_export_serializer_class(self):
        if self.export_serializer_classes:
            return self.export_serializer_classes[self.action]
        return self.get_serializer_class()

    def get_serializer_class(self):
        action = self.action
        if action in self.export_serializer_classes.keys():
            return self.export_serializer_classes[action]

        return super().get_serializer_class()

    @extend_schema(description="Export data to Excel (xlsx)")
    @action(methods=['GET'], detail=False, renderer_classes=[XLSXRenderer])
    def export(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        queryset = queryset.order_by('id')
        serializer_class = self.get_export_serializer_class()

        ids = request.query_params.get('ids')
        if ids:
            ids_list = ids.split(',')
            queryset = queryset.filter(id__in=ids_list)

        serializer = serializer_class(queryset, many=True, context={'request': request})

        filename = f"export_{self.basename}_{timezone.now().strftime('%Y%m%d')}.xlsx"
        return Response(
            serializer.data,
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )
