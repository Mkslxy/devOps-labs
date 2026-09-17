import pytest
from unittest.mock import patch, MagicMock
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError

from apps.classes.models import Lesson, Group, LessonType, GroupStudent, LessonStudent
from apps.classes.models.lesson import LessonStatus, PlanStatus
from apps.classes.models.group_student import GroupStudentStatus
from apps.classes.models.lesson_student import VisitStatus
from apps.classes.services.lesson import (
    create_lesson, cancel_participation_by_student,
    cancel_lesson_by_teacher_service, update_lesson_plan_service,
    review_lesson_plan_service
)

User = get_user_model()

from apps.users.models import Role

@pytest.fixture
def teacher(db):
    role, _ = Role.objects.get_or_create(id=2, defaults={'name': 'Teacher', 'slug': 'teacher'})
    return User.objects.create_user(
        email="teacher@test.com",
        phone_normalized="+380991234567",
        phone_country_code="380",
        phone_national_number="991234567",
        password="password",
        role=role,
        first_name="Teacher"
    )

@pytest.fixture
def student(db):
    role, _ = Role.objects.get_or_create(id=4, defaults={'name': 'Student', 'slug': 'student'})
    return User.objects.create_user(
        email="student@test.com",
        phone_normalized="+380991234568",
        phone_country_code="380",
        phone_national_number="991234568",
        password="password",
        role=role,
        first_name="Student"
    )

@pytest.fixture
def group(db):
    return Group.objects.create(name="Test Group", is_online=False)

@pytest.fixture
def lesson_type(db):
    return LessonType.objects.create(name="Math", duration_minutes=60)

@pytest.fixture
def active_group_student(db, group, student):
    return GroupStudent.objects.create(group=group, student=student, status=GroupStudentStatus.ACTIVE)

@pytest.fixture
def lesson(db, group, teacher, lesson_type):
    return Lesson.objects.create(
        group=group,
        teacher=teacher,
        lesson_type=lesson_type,
        start_time=timezone.now(),
        end_time=timezone.now() + timezone.timedelta(hours=1),
        status=LessonStatus.SCHEDULED,
        topic="Test Topic"
    )

@pytest.fixture
def lesson_student(db, lesson, student):
    return LessonStudent.objects.create(lesson=lesson, student=student, status=VisitStatus.PLANNED)


@pytest.mark.django_db
@patch('apps.classes.services.lesson.GoogleCalendarService.create_event')
@patch('apps.classes.services.lesson.create_lesson_column')
def test_create_lesson(mock_create_column, mock_create_event, db, group, teacher, lesson_type, active_group_student):
    # Mocking
    mock_create_event.return_value = {
        'google_id': 'g_123',
        'meet_link': 'http://meet',
        'html_link': 'http://html'
    }
    mock_create_column.return_value = MagicMock(id=1)
    
    # Mock Serializer
    serializer = MagicMock()
    # the serializer.save() should return a new unsaved or saved lesson.
    new_lesson = Lesson(
        group=group, teacher=teacher, lesson_type=lesson_type, 
        start_time=timezone.now(), end_time=timezone.now() + timezone.timedelta(hours=1),
        topic="Serializer Topic"
    )
    new_lesson.save()
    serializer.save.return_value = new_lesson
    
    lesson_result = create_lesson(serializer)
    
    assert lesson_result.google_event_id == 'g_123'
    assert lesson_result.meet_link == 'http://meet'
    
    # Check if LessonStudent was created
    assert LessonStudent.objects.filter(lesson=lesson_result, student=active_group_student.student).exists()


@pytest.mark.django_db
@patch('apps.classes.services.lesson.GoogleCalendarService.delete_event')
def test_cancel_participation_by_student(mock_delete_event, db, lesson, lesson_student, student):
    is_canceled = cancel_participation_by_student(lesson, student)
    
    lesson_student.refresh_from_db()
    lesson.refresh_from_db()
    
    assert lesson_student.status == VisitStatus.CANCELLED
    assert is_canceled is True  # Since he was the only student, the lesson should be canceled
    assert lesson.status == LessonStatus.CANCELLED_BY_STUDENT
    mock_delete_event.assert_called_once_with(lesson)


@pytest.mark.django_db
@patch('apps.classes.services.lesson.GoogleCalendarService.delete_event')
def test_cancel_lesson_by_teacher_service(mock_delete_event, db, lesson, lesson_student):
    cancel_lesson_by_teacher_service(lesson, "Teacher is sick")
    
    lesson.refresh_from_db()
    lesson_student.refresh_from_db()
    
    assert lesson.status == LessonStatus.CANCELLED_BY_TEACHER
    assert lesson.cancelled_reason == "Teacher is sick"
    assert lesson_student.status == VisitStatus.CANCELLED
    mock_delete_event.assert_called_once_with(lesson)


@pytest.mark.django_db
def test_update_lesson_plan_service(db, lesson):
    data = {'lesson_plan': 'New plan details', 'send_for_review': True}
    
    updated_lesson = update_lesson_plan_service(lesson, data)
    
    assert updated_lesson.lesson_plan == 'New plan details'
    assert updated_lesson.plan_status == PlanStatus.ON_REVIEW

@pytest.mark.django_db
def test_update_lesson_plan_approved_fails(db, lesson):
    lesson.plan_status = PlanStatus.APPROVED
    lesson.save()
    
    data = {'lesson_plan': 'New plan details'}
    with pytest.raises(ValidationError):
        update_lesson_plan_service(lesson, data)


@pytest.mark.django_db
def test_review_lesson_plan_service_approve(db, lesson, teacher):
    lesson.plan_status = PlanStatus.ON_REVIEW
    lesson.save()
    
    data = {'action': 'approve', 'feedback': 'Good job!'}
    reviewed_lesson = review_lesson_plan_service(lesson, teacher, data)
    
    assert reviewed_lesson.plan_status == PlanStatus.APPROVED
    assert reviewed_lesson.plan_approved_by == teacher
    assert reviewed_lesson.plan_feedback == 'Good job!'
