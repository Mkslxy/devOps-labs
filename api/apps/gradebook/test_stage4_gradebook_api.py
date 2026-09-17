import pytest

from apps.classes.models import Group, GroupStudent
from apps.classes.models.group import AgeGroup, GroupStatus, KnowledgeLevel
from apps.gradebook.models import Attendance, Grade
from apps.gradebook.models.attendence import AttendanceCategory
from apps.gradebook.models.grade_column import GradeColumn
from apps.gradebook.services import get_aggregated_gradebook


@pytest.fixture
def gradebook_group(school, teacher_user, student_user):
    group = Group.objects.create(
        name="Gradebook QA Group",
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
def test_assign_grade_integration_persists_grade(admin_client, gradebook_group, student_user):
    column = GradeColumn.objects.create(title="Classwork", group=gradebook_group)

    response = admin_client.post(
        "/grade/",
        {
            "column": column.id,
            "student": student_user.id,
            "category": "classwork",
            "value": 10,
            "comment": "Excellent",
        },
        format="multipart",
    )

    assert response.status_code == 201
    assert Grade.objects.filter(column=column, student=student_user, value=10).exists()


@pytest.mark.django_db
def test_attendance_batch_integration_creates_attendance(admin_client, gradebook_group, student_user):
    column = GradeColumn.objects.create(title="Attendance", group=gradebook_group)

    response = admin_client.post(
        "/attendance/batch/",
        {
            "column": column.id,
            "category": AttendanceCategory.PRESENT,
            "students": [student_user.id],
        },
        format="json",
    )

    assert response.status_code == 200
    assert Attendance.objects.filter(column=column, student=student_user, category=AttendanceCategory.PRESENT).exists()


@pytest.mark.django_db
def test_gradebook_unit_aggregates_created_grade(gradebook_group, student_user):
    column = GradeColumn.objects.create(title="Unit Column", group=gradebook_group)
    Grade.objects.create(column=column, student=student_user, category="classwork", value=9)

    data = get_aggregated_gradebook(gradebook_group.id, column.date, column.date, student_user)

    assert data["students"] == [{"id": student_user.id, "full_name": student_user.full_name}]
    assert data["columns"][0]["id"] == column.id
    assert data["cells"][f"{student_user.id}_{column.id}"]["grades"][0]["value"] == 9
