import logging
logger = logging.getLogger(__name__)

from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.classes.models import Lesson, LessonStudent, GroupStudent, Group, LessonType
from apps.classes.models.group_student import GroupStudentStatus
from apps.classes.models.lesson import LessonStatus, PlanStatus
from apps.classes.models.lesson_student import VisitStatus
from apps.classes.utils import generate_dates_for_rule
from apps.finance.utils import deduct_lessons_for_group
from apps.google_integration.services import GoogleCalendarService
from apps.gradebook.services import create_lesson_column, update_lesson_column
from apps.telegram.utils import delete_notifications_log_by_obj_id
from apps.users.models import User


def create_lesson(serializer) -> Lesson:
    with transaction.atomic():
        lesson = serializer.save()

        active_group_students = GroupStudent.objects.filter(
            group=lesson.group,
            status=GroupStudentStatus.ACTIVE
        )

        lesson_students = [
            LessonStudent(
                lesson=lesson,
                student=gs.student,
                status=VisitStatus.PLANNED
            ) for gs in active_group_students
        ]
        LessonStudent.objects.bulk_create(lesson_students)

    try:
        google_data = GoogleCalendarService.create_event(lesson)

        lesson.google_event_id = google_data['google_id']
        lesson.meet_link = google_data['meet_link']
        lesson.html_link = google_data['html_link']
        lesson.grade_column = create_lesson_column(lesson)

        lesson.save(update_fields=['google_event_id', 'meet_link', 'html_link', 'grade_column'])

    except Exception as e:
        logger.error(f"Google sync failed: {e}")

    return lesson


def update_lesson(instance: Lesson, serializer) -> Lesson:
    old_teacher = instance.teacher
    old_start_time = instance.start_time
    old_status = instance.status

    with transaction.atomic():
        lesson = serializer.save()

    new_teacher = lesson.teacher
    new_start_time = lesson.start_time
    new_status = lesson.status

    if old_status != LessonStatus.COMPLETED and new_status == LessonStatus.COMPLETED:
        logger.error("LESSON COMPLETED!")
        debtors = deduct_lessons_for_group(lesson)

    if old_start_time != new_start_time:
        delete_notifications_log_by_obj_id(lesson.id, Lesson)

    try:
        if old_teacher != new_teacher:
            lesson.teacher = old_teacher
            GoogleCalendarService.delete_event(lesson)

            lesson.teacher = new_teacher

            google_data = GoogleCalendarService.create_event(lesson)

            lesson.google_event_id = google_data['google_id']
            lesson.meet_link = google_data['meet_link']
            lesson.html_link = google_data['html_link']
            lesson.save(update_fields=['google_event_id', 'meet_link', 'html_link'])

        else:
            i_column, l_column = instance.grade_column, lesson.grade_column
            if i_column and l_column:
                i_date, l_date = instance.start_time.date(), lesson.start_time.date()
                if i_date != l_date:
                    update_lesson_column(lesson, l_date)
            else:
                lesson.grade_column = create_lesson_column(lesson)
                lesson.save(update_fields=['grade_column'])

            GoogleCalendarService.update_event(lesson)

    except Exception as e:
        logger.error(f"Error syncing with Google: {e}")

    return lesson


def cancel_participation_by_student(lesson: Lesson, student):
    try:
        enrollment = LessonStudent.objects.get(lesson=lesson, student=student)
    except LessonStudent.DoesNotExist:
        return Response({"error": "You are not participating in this lesson."}, status=403)

    if lesson.is_finished:
        raise ValidationError({"message": "Cannot cancel participation for finished lesson."}, 400)

    is_lesson_canceled = False

    with transaction.atomic():
        enrollment.status = VisitStatus.CANCELLED
        enrollment.save()

        active_students_exists = lesson.students.filter(
            status=VisitStatus.PLANNED
        ).exists()

        if not active_students_exists:
            is_lesson_canceled = True

            lesson.status = LessonStatus.CANCELLED_BY_STUDENT
            lesson.cancelled_reason = "All students cancelled their participation."
            lesson.save()

    if is_lesson_canceled:
        try:
            GoogleCalendarService.delete_event(lesson)
        except Exception as e:
            logger.error(f"Failed to delete Google Event: {e}")

    return is_lesson_canceled


def cancel_lesson_by_teacher_service(lesson: Lesson, reason):
    if lesson.is_finished:
        raise ValidationError({"message": "Cannot cancel participation for finished lesson."}, 400)

    with transaction.atomic():
        lesson.status = LessonStatus.CANCELLED_BY_TEACHER
        lesson.cancelled_reason = reason
        lesson.save()

        lesson.students.filter(status=VisitStatus.PLANNED).update(
            status=VisitStatus.CANCELLED
        )

    try:
        GoogleCalendarService.delete_event(lesson)
    except Exception as e:
        logger.error(f"Failed to delete Google Event: {e}")


def create_recurring_lessons_service(data, user):
    group_id = data['group_id']
    teacher_id = data['teacher_id']

    start_date = data['start_date']
    end_date = data['end_date']
    schedule = data['schedule']

    type_ids = set()
    if 'lesson_type_id' in data: type_ids.add(data['lesson_type_id'])
    for item in schedule:
        if 'lesson_type_id' in item: type_ids.add(item['lesson_type_id'])

    lesson_types_map = {lt.id: lt for lt in LessonType.objects.filter(id__in=type_ids)}

    lessons_buffer = []

    with transaction.atomic():
        group = Group.objects.get(id=group_id)
        teacher = User.objects.get(id=teacher_id)

        active_student_ids = list(GroupStudent.objects.filter(
            group_id=group_id,
            status=GroupStudentStatus.ACTIVE
        ).values_list('student_id', flat=True))

        for item in schedule:

            current_type_id = item.get('lesson_type_id') or data.get('lesson_type_id')
            current_lesson_type = lesson_types_map[current_type_id]
            current_duration = timedelta(minutes=current_lesson_type.duration_minutes)

            is_online = item['is_online'] if 'is_online' in item else data.get('is_online', False)

            rule_dates = generate_dates_for_rule(
                start_date,
                end_date,
                item['day_of_week'],
                item['time']
            )

            for lesson_start in rule_dates:
                lesson = Lesson(
                    group=group,
                    teacher=teacher,
                    lesson_type=current_lesson_type,
                    topic=data['topic'],
                    description=data.get('description', ''),

                    start_time=lesson_start,
                    end_time=lesson_start + current_duration,

                    is_online=is_online,
                    status=LessonStatus.SCHEDULED,
                    created_by=user,
                    color_id=data.get('color_id', '3')
                )
                lesson.grade_column = create_lesson_column(lesson)
                lesson.save()
                lessons_buffer.append(lesson)

                if active_student_ids:
                    LessonStudent.objects.bulk_create([
                        LessonStudent(
                            lesson=lesson,
                            student_id=student_id,
                            status=VisitStatus.PLANNED
                        ) for student_id in active_student_ids
                    ])

    if not lessons_buffer:
        return []

    CHUNK_SIZE = 50
    google_results = {}
    teacher_user = lessons_buffer[0].teacher

    try:
        for i in range(0, len(lessons_buffer), CHUNK_SIZE):
            chunk = lessons_buffer[i:i + CHUNK_SIZE]
            batch_result = GoogleCalendarService.batch_create_events(chunk, user=teacher_user)
            google_results.update(batch_result)
    except Exception as e:
        logger.error(f"Google Batch Error: {e}")

    lessons_to_update = []
    for lesson in lessons_buffer:
        res = google_results.get(lesson.id)
        if res:
            lesson.google_event_id = res['google_id']
            lesson.meet_link = res['meet_link']
            lesson.html_link = res['html_link']
            lessons_to_update.append(lesson)

    if lessons_to_update:
        Lesson.objects.bulk_update(
            lessons_to_update,
            ['google_event_id', 'meet_link', 'html_link']
        )

    return lessons_buffer


def update_lesson_plan_service(lesson, data):
    if lesson.plan_status == PlanStatus.APPROVED:
        raise ValidationError({"message": "Plan that is already approved cannot be edited."})

    lesson.lesson_plan = data['lesson_plan']

    if data.get('send_for_review'):
        lesson.plan_status = PlanStatus.ON_REVIEW
    else:
        lesson.plan_status = PlanStatus.DRAFT

    lesson.save(update_fields=['lesson_plan', 'plan_status'])
    return lesson


def review_lesson_plan_service(lesson, reviewer, data):
    if lesson.plan_status != PlanStatus.ON_REVIEW:
        raise ValidationError({"message": "Plan is not at the stage of review."})

    if data['action'] == 'approve':
        lesson.plan_status = PlanStatus.APPROVED
        lesson.plan_approved_by = reviewer
        lesson.plan_approved_at = timezone.now()
        lesson.plan_feedback = data.get('feedback', '')
    else:
        lesson.plan_status = PlanStatus.CHANGES_REQUESTED
        lesson.plan_feedback = data['feedback']
        lesson.plan_approved_by = None

    lesson.save(update_fields=['plan_status', 'plan_feedback', 'plan_approved_by', 'plan_approved_at'])
    return lesson
