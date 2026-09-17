import pytest

from apps.testing.models import Question, Test, TestVersion
from apps.testing.models.question import QuestionType
from apps.testing.serializers import QuestionSerializer


@pytest.mark.django_db
def test_create_test_smoke_creates_initial_draft_version(admin_client):
    response = admin_client.post(
        "/test-management/tests/",
        {"title": "Stage 4 Placement Test", "description": "Smoke test"},
        format="json",
    )

    assert response.status_code == 201
    test = Test.objects.get(id=response.data["id"])
    assert test.current_version is not None
    assert TestVersion.objects.filter(test=test, version_number=1, status="draft").exists()


@pytest.mark.django_db
def test_create_question_integration_persists_options(admin_client):
    response = admin_client.post(
        "/test-management/questions/",
        {
            "text": "Choose the correct answer",
            "points": 5,
            "type": QuestionType.SINGLE_CHOICE,
            "options": [
                {"option_text": "Wrong", "is_correct": False},
                {"option_text": "Correct", "is_correct": True},
            ],
        },
        format="json",
    )

    assert response.status_code == 201
    question = Question.objects.get(id=response.data["id"])
    assert question.options.count() == 2
    assert question.options.filter(is_correct=True).count() == 1


def test_question_serializer_unit_rejects_single_choice_without_exactly_one_correct_option():
    serializer = QuestionSerializer(
        data={
            "text": "Invalid single choice",
            "points": 2,
            "type": QuestionType.SINGLE_CHOICE,
            "options": [
                {"option_text": "A", "is_correct": True},
                {"option_text": "B", "is_correct": True},
            ],
        }
    )

    assert serializer.is_valid() is False
