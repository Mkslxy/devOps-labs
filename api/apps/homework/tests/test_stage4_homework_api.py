import pytest
from datetime import timedelta
from django.utils import timezone

from apps.classes.models import Group, GroupStudent, Lesson, LessonType
from apps.classes.models.group import AgeGroup, GroupStatus, KnowledgeLevel
from apps.homework.models import Homework, HomeworkSubmission


@pytest.fixture
def homework_group(school, teacher_user, student_user):
    group = Group.objects.create(
        name="Homework QA Group",
        status=GroupStatus.ACTIVE,
        age_group=AgeGroup.TEENS,
        knowledge_level=KnowledgeLevel.BEGINNER,
        teacher=teacher_user,
        school=school,
        is_online=True,
        created_by=teacher_user,
    )
    GroupStudent.objects.create(group=group, student=student_user)
    return group


@pytest.mark.django_db
def test_create_homework_integration_creates_grade_column(admin_client, homework_group):
    response = admin_client.post(
        "/homework/",
        {
            "title": "Stage 4 Homework",
            "description": "Integration homework",
            "deadline": (timezone.now() + timedelta(days=5)).isoformat(),
            "group_id": homework_group.id,
        },
        format="multipart",
    )

    assert response.status_code == 201
    homework = Homework.objects.get(id=response.data["id"])
    assert homework.group == homework_group
    assert homework.grade_column is not None


@pytest.mark.django_db
def test_submit_homework_integration_persists_submission(api_client, homework_group, student_user, teacher_user):
    api_client.force_authenticate(user=student_user)
    lesson_type = LessonType.objects.create(name="HW Lesson", slug="hw-lesson", duration_minutes=45)
    lesson = Lesson.objects.create(
        group=homework_group,
        teacher=teacher_user,
        lesson_type=lesson_type,
        topic="Homework lesson",
        start_time=timezone.now() + timedelta(days=1),
        end_time=timezone.now() + timedelta(days=1, minutes=45),
        is_online=True,
        created_by=teacher_user,
    )
    homework = Homework.objects.create(
        lesson=lesson,
        title="Submit me",
        deadline=timezone.now() + timedelta(days=3),
        created_by=teacher_user,
    )

    response = api_client.post(
        "/homework-submission/",
        {"homework_id": homework.id, "submission_text": "Done"},
        format="multipart",
    )

    assert response.status_code == 201
    assert HomeworkSubmission.objects.filter(homework=homework, student=student_user).exists()


def test_homework_unit_deadline_property():
    homework = Homework(deadline=timezone.now() - timedelta(minutes=1))

    assert homework.is_deadline_passed is True
