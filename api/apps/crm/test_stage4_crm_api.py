import pytest

from apps.crm.models import Lead
from apps.crm.models.lead import LeadStatus


@pytest.mark.django_db
def test_create_lead_smoke_persists_new_lead(admin_client):
    response = admin_client.post(
        "/leads/",
        {
            "name": "Stage 4 Lead",
            "email": "lead.stage4@example.com",
            "phone": "+380501112233",
            "source": "landing",
            "status": LeadStatus.NEW,
            "notes": "Created during smoke testing",
            "city": "Kyiv",
        },
        format="json",
    )

    assert response.status_code == 201
    assert Lead.objects.filter(email="lead.stage4@example.com", status=LeadStatus.NEW).exists()


@pytest.mark.django_db
def test_lead_unit_status_transition_to_processing():
    lead = Lead.objects.create(
        name="Manual Lead",
        email="manual.lead@example.com",
        phone="+380501112244",
        source="referral",
        status=LeadStatus.NEW,
    )

    lead.status = LeadStatus.PROCESSING
    lead.save(update_fields=["status"])

    assert Lead.objects.get(id=lead.id).status == LeadStatus.PROCESSING
