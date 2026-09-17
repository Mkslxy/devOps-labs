from drf_spectacular.utils import extend_schema
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.utils import HasPermission
from apps.magic_import.serializers import TestMagicImportSerializer, CourseMagicImportSerializer
from apps.magic_import.services.gemini_service import GeminiService


class TestMagicImportView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    permission_classes = [HasPermission]
    required_permission = ['tests.read', 'tests.write', 'magic-import.tests']

    @extend_schema(tags=['MagicImport/Test'], request=TestMagicImportSerializer)
    def post(self, request, *args, **kwargs):
        serializer = TestMagicImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        photo_obj = serializer.validated_data['photo']

        try:
            parsed_json = GeminiService.gen_test_from_photo(photo_obj)
            return Response(parsed_json, status=200)
        except Exception as e:
            return Response({"message": str(e)}, status=400)


class CourseMagicImportView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    permission_classes = [HasPermission]
    required_permission = ['courses.read', 'courses.write', 'magic-import.courses']

    @extend_schema(tags=['MagicImport/Course'], request=CourseMagicImportSerializer)
    def post(self, request, *args, **kwargs):
        serializer = CourseMagicImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file_obj = serializer.validated_data['file']

        try:
            parsed_json = GeminiService.gen_course_from_pdf(file_obj)
            return Response(parsed_json, status=200)
        except Exception as e:
            return Response({"message": str(e)}, status=400)


