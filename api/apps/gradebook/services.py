import logging
logger = logging.getLogger(__name__)

from collections import defaultdict

from django.contrib.contenttypes.models import ContentType
from django.db.models import Prefetch
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.classes.models import Lesson, Group
from apps.classes.models.group_student import GroupStudentStatus
from apps.courses.models import TaskSubmission, TaskAssignment
from apps.gradebook.models import Grade, Attendance
from apps.homework.models import HomeworkSubmission
from apps.gradebook.models.grade import GradeCategory
from apps.gradebook.models.grade_column import GradeColumn
from apps.testing.models import TestAttempt
from apps.testing.models.test_assigment import TestAssignment
from apps.users.models import User


def update_grade(value=0, comment=None, rated_by=None, grade: Grade | None = None):
    grade.value = value
    grade.comment = comment
    grade.created_by = rated_by
    grade.save()


### TESTING
def set_test_grade(score, test_attempt: TestAttempt):
    student = test_attempt.student
    assignment: TestAssignment = test_attempt.assignment

    column = assignment.grade_column
    content_type = ContentType.objects.get_for_model(test_attempt)

    return Grade.objects.create(
        column=column,
        category=GradeCategory.TEST,
        student=student,

        content_type=content_type,
        object_id=test_attempt.id,

        value=score,
    )


def create_assignment_column(assignment_data):
    group = get_assigment_group(assignment_data)

    if group is None:
        return None

    date = timezone.now().date()  # Або час початку тесту, якщо я потім це додам
    title = assignment_data['test'].title

    return GradeColumn.objects.create(
        group=group,
        date=date,
        title=title,
    )


def get_assigment_group(assignment_data):
    if assignment_data.get('lesson'):
        return assignment_data['lesson'].group
    if assignment_data.get('group'):
        return assignment_data['group']
    return None


### HOMEWORK
def set_homework_grade(value, comment, rated_by, hw_sub: HomeworkSubmission):
    column = hw_sub.homework.grade_column

    student = hw_sub.student

    content_type = ContentType.objects.get_for_model(hw_sub)

    return Grade.objects.create(
        column=column,
        category=GradeCategory.HOMEWORK,
        student=student,

        content_type=content_type,
        object_id=hw_sub.id,

        value=value,
        comment=comment,

        created_by=rated_by
    )


def delete_homework_grade(hw_sub: HomeworkSubmission):
    if not hw_sub.is_rated:
        raise ValidationError({"message": "Homework is not rated"})

    grade = hw_sub.grade
    grade.delete()
    hw_sub.grade = None

    hw_sub.save()
    grade.save()


def create_homework_column(homework_data):
    group = get_homework_group(homework_data)

    if group is None:
        return None

    date = get_homework_column_date(homework_data)
    title = homework_data['title']

    return GradeColumn.objects.create(
        group=group,
        date=date,
        title=title,
    )


def get_homework_group(homework_data):
    if homework_data.get('group'):
        return homework_data['group']
    if homework_data.get("lesson"):
        return homework_data['lesson'].group
    return None


def get_homework_column_date(homework_data):
    lesson = homework_data.get('lesson')
    if lesson:
        return lesson.start_time.date()
    return timezone.now().date()


### LESSON
def set_lesson_grade(value, comment, rated_by, student, lesson: Lesson):
    column = lesson.grade_column

    if column is None:
        column = create_lesson_column(lesson)
        lesson.grade_column = column
        lesson.save(update_fields=['grade_column'])

    content_type = ContentType.objects.get_for_model(lesson)

    return Grade.objects.create(
        column=column,
        category=GradeCategory.CLASSWORK,
        student=student,

        content_type=content_type,
        object_id=lesson.id,

        value=value,
        comment=comment,

        created_by=rated_by
    )


def delete_lesson_grade(lesson, grade):
    content_type = ContentType.objects.get_for_model(lesson)
    if any((grade.content_type != content_type, grade.column != lesson.grade_column, grade.object_id != lesson.id)):
        raise ValidationError({"message": "Grade does not belong to the lesson"})

    grade.delete()
    grade.save()


def create_lesson_column(lesson):
    group = lesson.group
    date = lesson.start_time.date()
    title = lesson.topic

    return GradeColumn.objects.create(
        group=group,
        date=date,
        title=title
    )


def update_lesson_column(lesson, date):
    column = lesson.grade_column

    if column is None:
        return

    column.date = date
    column.save()


### GRADEBOOK SERVICE
def get_aggregated_gradebook(group_id: int, start_date, end_date, request_user):
    can_see_all = request_user.has_permission('gradebook.read_teacher') or \
                  request_user.has_permission('gradebook.manage_all')

    students_qs = User.objects.filter(
        groupstudent__group_id=group_id,
        groupstudent__status=GroupStudentStatus.ACTIVE
    )

    if not can_see_all:
        students_qs = students_qs.filter(id=request_user.id)

    students = students_qs.order_by('last_name', 'first_name').distinct()

    students_data = [
        {"id": s.id, "full_name": s.full_name} for s in students
    ]

    columns_qs = GradeColumn.objects.filter(
        group_id=group_id,
        date__range=(start_date, end_date)
    ).order_by('date', 'id')

    grades_qs = Grade.objects.all().select_related('created_by').prefetch_related('files')
    attendance_qs = Attendance.objects.all()

    if not can_see_all:
        grades_qs = grades_qs.filter(student=request_user)
        attendance_qs = attendance_qs.filter(student=request_user)

    columns = columns_qs.prefetch_related(
        Prefetch('grades', queryset=grades_qs),
        Prefetch('attendance', queryset=attendance_qs)
    )

    columns_data = []
    cells_map = defaultdict(lambda: {"grades": [], "attendance": []})

    for col in columns:
        columns_data.append({
            "id": col.id,
            "title": col.title,
            "date": col.date,
            "has_grades": col.has_grades
        })

        for grade in col.grades.all():
            key = f"{grade.student_id}_{col.id}"

            files_data = [
                {"id": f.id, "url": f.file.url, "name": f.name or f.file.name}
                for f in grade.files.all()
            ]

            created_by_data = None
            if grade.created_by:
                created_by_data = {"id": grade.created_by.id, "full_name": grade.created_by.full_name}

            cells_map[key]["grades"].append({
                "id": grade.id,
                "value": grade.value,
                "comment": grade.comment,
                "files": files_data,
                "created_by": created_by_data
            })

        for att in col.attendance.all():
            key = f"{att.student_id}_{col.id}"
            cells_map[key]["attendance"].append({
                "id": att.id,
                "status": att.category,
                "late_minutes": att.late_minutes,
                "comment": att.comment
            })

    return {
        "students": students_data,
        "columns": columns_data,
        "cells": cells_map
    }


### TASK
def set_task_grade(value, comment, rated_by, task_sub: TaskSubmission):
    student = task_sub.student
    task = task_sub.task

    assignment = TaskAssignment.objects.filter(
        task=task,
        group__groupstudent__student=student,
        group__groupstudent__status='active'
    ).select_related('grade_column').first()

    if not assignment:
        raise ValidationError("Cannot rate: Student is not active in any group assigned to this task.")

    column = assignment.grade_column

    content_type = ContentType.objects.get_for_model(task_sub)

    grade = Grade.objects.create(
        column=column,
        category=GradeCategory.TASK,
        student=student,

        content_type=content_type,
        object_id=task_sub.id,

        value=value,
        comment=comment,
        created_by=rated_by
    )

    return grade


def delete_task_grade(task_sub):
    if not task_sub.is_rated:
        raise ValidationError({"message": "Task  is not rated"})

    grade = task_sub.grade
    grade.delete()
    task_sub.grade = None

    task_sub.save()
    grade.save()
