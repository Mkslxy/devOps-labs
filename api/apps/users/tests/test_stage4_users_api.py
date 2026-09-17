import pytest

from apps.users.models import ResetCode


@pytest.mark.django_db
def test_login_smoke_sets_auth_cookies(api_client, admin_user):
    response = api_client.post(
        "/auth/login/",
        {"email": admin_user.email, "password": "StrongPass123!"},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["message"] == "success"
    assert response.data["user"]["email"] == admin_user.email
    assert "access-token" in response.cookies
    assert "refresh-token" in response.cookies


@pytest.mark.django_db
def test_profile_integration_reads_authenticated_user(admin_client, admin_user):
    response = admin_client.get("/profile/me/")

    assert response.status_code == 200
    assert response.data["id"] == admin_user.id
    assert response.data["email"] == admin_user.email


def test_reset_code_unit_generates_numeric_code():
    code = ResetCode.generate_code(length=8)

    assert len(code) == 8
    assert code.isdigit()
