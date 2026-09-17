from django.db.models import Avg, Count, F, ExpressionWrapper, DurationField, FloatField, Q
from django.db.models.functions import TruncDate

from apps.testing.models.test_attempt import TestAttempt, TestAttemptStatus
from apps.testing.models.student_answer import StudentAnswer
from apps.testing.models.question import QuestionType
from apps.homework.models.homework_submission import HomeworkSubmission
from apps.gradebook.models.grade import Grade, GradeCategory
from apps.gradebook.models.attendence import Attendance, AttendanceCategory
from apps.classes.models.group_student import GroupStudentStatus


# ==========================
# HELPERS
# ==========================
def student_attempts_qs(student):
    return TestAttempt.objects.filter(student=student)


def student_group_attempts_qs(student, group):
    return TestAttempt.objects.filter(
        student=student,
        status__in=[TestAttemptStatus.COMPLETED, TestAttemptStatus.IN_PROGRESS]
    ).filter(
        Q(assignment__group=group) | Q(assignment__lesson__group=group)
    )


def group_attempts_qs(group):
    return TestAttempt.objects.filter(
        student__groupstudent__group=group,
        student__groupstudent__status=GroupStudentStatus.ACTIVE
    )


def annotate_percent(qs):
    return qs.annotate(
        percent=ExpressionWrapper(
            F('grade__value') * 100.0 / F('max_possible_score'),
            output_field=FloatField()
        )
    )


# ==========================
# TEST METRICS
# ==========================
def get_tests_taken(student):
    return student_attempts_qs(student).count()


def get_tests_completed(student):
    return student_attempts_qs(student).filter(status=TestAttemptStatus.COMPLETED).count()


def get_tests_passed(student):
    return student_attempts_qs(student).filter(
        status=TestAttemptStatus.COMPLETED,
        is_passed=True
    ).count()


def get_average_test_percent(qs):
    qs = qs.filter(
        status=TestAttemptStatus.COMPLETED,
        grade__isnull=False,
        max_possible_score__gt=0
    )
    qs = annotate_percent(qs)
    return round(qs.aggregate(avg=Avg('percent'))['avg'] or 0, 2)


def get_test_progress_over_time(qs):
    qs = qs.filter(
        status=TestAttemptStatus.COMPLETED,
        grade__isnull=False,
        finished_at__isnull=False,
        max_possible_score__gt=0
    )
    qs = annotate_percent(qs).annotate(date=TruncDate('finished_at'))
    data = qs.values('date').annotate(avg_percent=Avg('percent')).order_by('date')
    return list(data)


def get_test_score_distribution(qs):
    buckets = {"0-50": 0, "50-70": 0, "70-85": 0, "85-100": 0}
    qs = qs.filter(status=TestAttemptStatus.COMPLETED, grade__isnull=False, max_possible_score__gt=0)
    qs = annotate_percent(qs)
    for p in qs.values_list('percent', flat=True):
        if p < 50:
            buckets["0-50"] += 1
        elif p < 70:
            buckets["50-70"] += 1
        elif p < 85:
            buckets["70-85"] += 1
        else:
            buckets["85-100"] += 1
    return buckets


def get_test_performance_trend(qs):
    data = get_test_progress_over_time(qs)
    if len(data) < 2:
        return "stable"
    first = data[0]['avg_percent']
    last = data[-1]['avg_percent']
    if last - first > 5:
        return "up"
    if first - last > 5:
        return "down"
    return "stable"


def get_accuracy_by_question_type(qs):
    answer_qs = StudentAnswer.objects.filter(
        attempt__in=qs,
        question__points__gt=0,
        score_awarded__isnull=False,
        attempt__status=TestAttemptStatus.COMPLETED
    ).annotate(accuracy=F('score_awarded') / F('question__points'))

    data = answer_qs.values('question__type').annotate(avg_accuracy=Avg('accuracy'))
    return {
        item['question__type']: round(item['avg_accuracy'] * 100, 2)
        for item in data
        if item['question__type'] in QuestionType.values
    }


def get_average_test_duration(student):
    qs = student_attempts_qs(student).filter(
        status=TestAttemptStatus.COMPLETED,
        finished_at__isnull=False,
        started_at__isnull=False
    ).annotate(duration=ExpressionWrapper(F('finished_at') - F('started_at'), output_field=DurationField()))
    avg = qs.aggregate(avg=Avg('duration'))['avg']
    return avg.total_seconds() if avg else 0


# ==========================
# HOMEWORK METRICS
# ==========================
def get_homeworks_total(student):
    return HomeworkSubmission.objects.filter(student=student).count()


def get_homeworks_graded(student):
    return HomeworkSubmission.objects.filter(student=student, grade__isnull=False).count()


def get_average_homework_score(student):
    return Grade.objects.filter(student=student, category=GradeCategory.HOMEWORK).aggregate(avg=Avg('value'))[
        'avg'] or 0


# ==========================
# ATTENDANCE METRICS
# ==========================
def get_attendance_stats(student):
    total = Attendance.objects.filter(student=student).count()
    if total == 0:
        return {"present_percent": 0, "late_percent": 0, "absent_percent": 0}

    stats = Attendance.objects.filter(student=student).values('category').annotate(count=Count('id'))
    result = {s['category']: s['count'] for s in stats}

    return {
        "present_percent": result.get(AttendanceCategory.PRESENT, 0) * 100 / total,
        "late_percent": result.get(AttendanceCategory.LATE, 0) * 100 / total,
        "absent_percent": result.get(AttendanceCategory.ABSENT, 0) * 100 / total,
    }


def get_average_late_minutes(student):
    return \
            Attendance.objects.filter(student=student, category=AttendanceCategory.LATE).aggregate(
                avg=Avg('late_minutes'))[
                'avg'] or 0


# ==========================
# GRADE METRICS
# ==========================
def get_grades_by_category(student):
    qs = Grade.objects.filter(student=student).values('category').annotate(avg=Avg('value'))
    return {item['category']: item['avg'] for item in qs}


def get_overall_score(student, weights=None):
    weights = weights or {"tests": 0.5, "homework": 0.3, "attendance": 0.2}
    test_score = get_average_test_percent(student_attempts_qs(student))
    homework_score = get_average_homework_score(student)
    attendance = get_attendance_stats(student)["present_percent"]

    return round(
        test_score * weights["tests"] + homework_score * weights["homework"] + attendance * weights["attendance"], 2)


# ==========================
# GROUP METRICS
# ==========================
def get_student_percentile_in_group(student, group):
    qs = group_attempts_qs(group).filter(
        status=TestAttemptStatus.COMPLETED, grade__isnull=False, max_possible_score__gt=0
    )
    qs = annotate_percent(qs).values('student').annotate(avg_percent=Avg('percent'))
    scores = list(qs)

    if len(scores) == 1:
        return 100

    row = next((x for x in scores if x['student'] == student.id), None)
    if not row:
        return 0

    below = sum(1 for x in scores if x['avg_percent'] < row['avg_percent'])
    return round(below / len(scores) * 100, 2)


def get_student_vs_group_avg_test(student, group):
    student_avg = get_average_test_percent(student_group_attempts_qs(student, group))
    group_avg = get_group_average_test_percent(group)
    return {"student": student_avg, "group_avg": group_avg, "delta": round(student_avg - group_avg, 2)}


def get_group_tests_completed(group):
    return group_attempts_qs(group).filter(status=TestAttemptStatus.COMPLETED).count()


def get_group_average_test_percent(group):
    qs = group_attempts_qs(group).filter(status=TestAttemptStatus.COMPLETED, grade__isnull=False,
                                         max_possible_score__gt=0)
    qs = annotate_percent(qs)
    return qs.aggregate(avg=Avg('percent'))['avg'] or 0


def get_group_test_score_distribution(group):
    buckets = {"0-50": 0, "50-70": 0, "70-85": 0, "85-100": 0}
    qs = group_attempts_qs(group).filter(status=TestAttemptStatus.COMPLETED, grade__isnull=False,
                                         max_possible_score__gt=0)
    qs = annotate_percent(qs)
    for p in qs.values_list('percent', flat=True):
        if p < 50:
            buckets["0-50"] += 1
        elif p < 70:
            buckets["50-70"] += 1
        elif p < 85:
            buckets["70-85"] += 1
        else:
            buckets["85-100"] += 1
    return buckets


# ==========================
# STUDENT PERFORMANCE
# ==========================
def get_student_performance(student):
    qs = student_attempts_qs(student)
    return {
        "tests": {
            "taken": get_tests_taken(student),
            "completed": get_tests_completed(student),
            "passed": get_tests_passed(student),
            "avg_percent": get_average_test_percent(qs),
            "trend": get_test_performance_trend(qs),
            "distribution": get_test_score_distribution(qs),
            "by_question_type": get_accuracy_by_question_type(qs),
        },
        "homework": {
            "avg_score": get_average_homework_score(student),
        },
        "attendance": get_attendance_stats(student),
        "overall_score": get_overall_score(student),
    }


def get_student_performance_in_group(student, group):
    qs = student_group_attempts_qs(student, group)

    tests_data = {
        "taken": qs.count(),
        "completed": qs.filter(status=TestAttemptStatus.COMPLETED).count(),
        "passed": sum(1 for attempt in qs if attempt.is_passed),
        "avg_percent": get_average_test_percent(qs),
        "trend": get_test_performance_trend(qs),
        "distribution": get_test_score_distribution(qs),
        "by_question_type": get_accuracy_by_question_type(qs),
    }

    data = {
        "tests": tests_data,
        "homework": {"avg_score": get_average_homework_score(student)},  # 🔹 додали
        "attendance": get_attendance_stats(student),                   # 🔹 додали
        "overall_score": get_overall_score(student),                   # 🔹 додали
        "group": {"percentile": get_student_percentile_in_group(student, group)},
    }

    return data



def get_group_performance(group):
    return {
        "tests": {
            "completed": get_group_tests_completed(group),
            "avg_percent": get_group_average_test_percent(group),
            "distribution": get_group_test_score_distribution(group),
        }
    }
