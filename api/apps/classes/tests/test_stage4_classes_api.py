import pytest
from datetime import timedelta
from django.utils import timezone

from apps.classes.models import Group, GroupStudent, Lesson, LessonStatus, LessonType
from apps.classes.models.group import AgeGroup, GroupStatus, KnowledgeLevel


@pytest.mark.django_db
def test_create_group_integration_assigns_student(admin_client, school, teacher_user, student_user):
    response = admin_client.post(
        "/groups/",
        {
            "name": "Stage 4 QA Group",
            "status": GroupStatus.ACTIVE,
            "age_group": AgeGroup.TEENS,
            "knowledge_level": KnowledgeLevel.BEGINNER,
            "teacher_id": teacher_user.id,
            "school_id": school.id,
            "student_ids": [student_user.id],
            "is_online": True,
        },
        format="json",
    )

    assert response.status_code == 201
    group = Group.objects.get(id=response.data["id"])
    assert group.teacher == teacher_user
    assert GroupStudent.objects.filter(group=group, student=student_user).exists()


@pytest.mark.django_db
def test_create_lesson_integration_persists_teacher_group_and_end_time(
    admin_client, school, teacher_user, student_user, future_start
):
    group = Group.objects.create(
        name="Lesson QA Group",
        status=GroupStatus.ACTIVE,
        age_group=AgeGroup.TEENS,
        knowledge_level=KnowledgeLevel.ELEMENTARY,
        teacher=teacher_user,
        school=school,
        is_online=True,
        created_by=teacher_user,
    )
    GroupStudent.objects.create(group=group, student=student_user)
    lesson_type = LessonType.objects.create(name="QA Lesson", slug="qa-lesson", duration_minutes=60)

    response = admin_client.post(
        "/lessons/",
        {
            "topic": "Smoke integration lesson",
            "description": "Created by Stage 4 tests",
            "group_id": group.id,
            "teacher_id": teacher_user.id,
            "lesson_type_id": lesson_type.id,
            "start_time": future_start.isoformat(),
            "is_online": True,
        },
        format="json",
    )

    assert response.status_code == 201
    lesson = Lesson.objects.get(id=response.data["id"])
    assert lesson.group == group
    assert lesson.teacher == teacher_user
    assert lesson.end_time == lesson.start_time + timedelta(minutes=60)


def test_lesson_unit_is_cancelled_property():
    lesson = Lesson(status=LessonStatus.CANCELLED_BY_TEACHER)

    assert lesson.is_cancelled is True
