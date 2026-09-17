import pytest

from apps.core.google_colors import GoogleCalendarColor


@pytest.mark.django_db
def test_google_colors_smoke_returns_color_catalog(api_client):
    response = api_client.get("/google/colors/")

    assert response.status_code == 200
    assert len(response.data) == len(GoogleCalendarColor)
    assert {"id", "hex", "name"}.issubset(response.data[0].keys())


@pytest.mark.django_db
def test_google_disconnect_integration_requires_connected_account(admin_client):
    response = admin_client.post("/google/disconnect/")

    assert response.status_code == 400
    assert response.data["detail"] == "Google Calendar is not connected."


def test_google_color_unit_exposes_calendar_color_values():
    values = {color.value for color in GoogleCalendarColor}

    assert "1" in values
    assert all(color.label.startswith("#") for color in GoogleCalendarColor)
