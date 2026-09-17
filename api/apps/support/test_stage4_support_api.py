import pytest
from rest_framework.exceptions import ValidationError

from apps.crm.models import Lead
from apps.support.models import CallbackRequest
from apps.support.models.callback_request import ContactPreference, RequestStatus


@pytest.mark.django_db
def test_callback_request_smoke_public_create(api_client):
    response = api_client.post(
        "/callback-request/",
        {
            "full_name": "Public Student",
            "email": "callback.stage4@example.com",
            "phone_country_code": "+380",
            "phone_national_number": "501112233",
            "message": "Please call me",
            "contact_preference": ContactPreference.PHONE,
            "callback_page": "https://example.com/course",
            "city": "Kyiv",
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["phone_normalized"] == "+380501112233"


@pytest.mark.django_db
def test_callback_to_lead_integration_creates_crm_lead(admin_client):
    callback = CallbackRequest.objects.create(
        full_name="Convert Me",
        email="convert.stage4@example.com",
        phone_country_code="+380",
        phone_national_number="501112244",
        phone_normalized="+380501112244",
        callback_page="https://example.com/demo",
        city="Lviv",
    )

    response = admin_client.post(f"/callback-request/{callback.id}/create-lead/", {}, format="json")

    assert response.status_code == 201
    callback.refresh_from_db()
    assert callback.status == RequestStatus.CONVERTED
    assert Lead.objects.filter(email="convert.stage4@example.com", phone="+380501112244").exists()


def test_callback_request_unit_requires_email_for_email_preference():
    callback = CallbackRequest(
        full_name="No Email",
        phone_country_code="+380",
        phone_national_number="501112255",
        phone_normalized="+380501112255",
        contact_preference=ContactPreference.EMAIL,
        callback_page="https://example.com",
    )

    with pytest.raises(ValidationError):
        callback.clean()
