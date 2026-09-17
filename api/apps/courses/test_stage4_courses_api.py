import pytest

from apps.courses.models import Course, CourseModule, CourseTopic, Subject


@pytest.mark.django_db
def test_create_course_chain_integration_persists_course_module_topic(admin_client):
    subject = Subject.objects.create(name="English Stage 4")

    course_response = admin_client.post(
        "/course/",
        {
            "title": "Stage 4 English",
            "description": "Integration course",
            "subject_id": subject.id,
            "price": "1200.00",
            "level": "A2",
            "is_active": True,
        },
        format="json",
    )
    assert course_response.status_code == 201

    module_response = admin_client.post(
        "/module/",
        {"title": "Grammar", "course": course_response.data["id"]},
        format="json",
    )
    assert module_response.status_code == 201

    topic_response = admin_client.post(
        "/topic/",
        {
            "title": "Present Simple",
            "content_description": "Rules and practice",
            "module": module_response.data["id"],
        },
        format="json",
    )
    assert topic_response.status_code == 201

    assert Course.objects.filter(title="Stage 4 English").exists()
    assert CourseModule.objects.filter(course_id=course_response.data["id"]).exists()
    assert CourseTopic.objects.filter(module_id=module_response.data["id"]).exists()


@pytest.mark.django_db
def test_subject_unit_generates_unique_slug():
    first = Subject.objects.create(name="Deutsch")
    second = Subject.objects.create(name="Deutsch!")

    assert first.slug == "deutsch"
    assert second.slug == "deutsch-1"
