from django.core.files.uploadedfile import SimpleUploadedFile
import pytest

from apps.magic_import.serializers import CourseMagicImportSerializer, TestMagicImportSerializer


def test_test_magic_import_serializer_unit_accepts_image_file():
    upload = SimpleUploadedFile(
        "test.gif",
        b"GIF87a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;",
        content_type="image/gif",
    )
    serializer = TestMagicImportSerializer(data={"photo": upload})

    assert serializer.is_valid(), serializer.errors


def test_course_magic_import_serializer_unit_accepts_pdf_file():
    upload = SimpleUploadedFile("course.pdf", b"%PDF-1.4", content_type="application/pdf")
    serializer = CourseMagicImportSerializer(data={"file": upload})

    assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
def test_magic_import_integration_rejects_missing_file(admin_client):
    response = admin_client.post("/magic-import/course-import/", {}, format="multipart")

    assert response.status_code == 400
    assert "file" in response.data["message"]
