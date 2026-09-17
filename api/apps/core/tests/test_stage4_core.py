import pytest
from django.utils import timezone

from apps.core.models import upload_to_document


@pytest.mark.django_db
def test_health_check_smoke_returns_ok(api_client):
    response = api_client.get("/health/")

    assert response.status_code == 200
    assert response.data["status"] == "OK"
    assert "timestamp" in response.data


def test_upload_to_document_unit_builds_document_path():
    class Document:
        pass

    class Attachment:
        document = Document()

    today = timezone.now().date()

    path = upload_to_document(Attachment(), "lesson-plan.pdf")

    assert path == f"Document/{today.year}/{today.month:02d}/lesson-plan.pdf"
