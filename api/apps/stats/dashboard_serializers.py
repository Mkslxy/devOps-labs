from rest_framework import serializers


class RecentLeadSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    phone = serializers.CharField(allow_null=True)
    status = serializers.CharField()
    source = serializers.CharField()
    created_at = serializers.DateTimeField()


class ChartDataSerializer(serializers.Serializer):
    date = serializers.CharField()
    display_date = serializers.CharField()
    leads = serializers.IntegerField()
    lessons = serializers.IntegerField()

class ManagerDashboardSerializer(serializers.Serializer):
    total_students = serializers.IntegerField()
    total_teachers = serializers.IntegerField()
    total_groups = serializers.IntegerField()
    new_leads = serializers.IntegerField()
    completed_lessons_this_month = serializers.IntegerField()
    recent_leads = RecentLeadSerializer(many=True)
    chart_data = ChartDataSerializer(many=True)

class DashboardUpcomingLessonSerializer(serializers.Serializer):
    time = serializers.CharField()
    student = serializers.CharField()
    students = serializers.IntegerField()
    type = serializers.CharField()

class DashboardTaskForReviewSerializer(serializers.Serializer):
    student = serializers.CharField()
    assignment = serializers.CharField()
    submitted = serializers.CharField()
    course = serializers.CharField()

class DashboardStudentSerializer(serializers.Serializer):
    name = serializers.CharField()
    course = serializers.CharField()
    progress = serializers.IntegerField()
    attendance = serializers.CharField()

class TeacherDashboardSerializer(serializers.Serializer):
    active_students = serializers.IntegerField()
    active_groups = serializers.IntegerField()
    lessons_this_week = serializers.IntegerField()
    planned_lessons_this_week = serializers.IntegerField()
    hours_worked_this_month = serializers.IntegerField()
    upcoming_lessons = DashboardUpcomingLessonSerializer(many=True)
    tasks_for_review = DashboardTaskForReviewSerializer(many=True)
    recent_students = DashboardStudentSerializer(many=True)

class StudentDashboardUpcomingLessonSerializer(serializers.Serializer):
    course = serializers.CharField()
    teacher = serializers.CharField()
    time = serializers.CharField()
    duration = serializers.CharField()

class StudentDashboardProgressSerializer(serializers.Serializer):
    course = serializers.CharField()
    progress = serializers.IntegerField()
    lessons_completed = serializers.IntegerField()
    lessons_total = serializers.IntegerField()

class StudentDashboardHomeworkSerializer(serializers.Serializer):
    title = serializers.CharField()
    course = serializers.CharField()
    deadline = serializers.CharField()
    status = serializers.CharField()

class StudentDashboardSerializer(serializers.Serializer):
    active_courses = serializers.IntegerField()
    lessons_left = serializers.IntegerField()
    lessons_total_paid = serializers.IntegerField()
    attendance_percent = serializers.IntegerField()
    achievements_count = serializers.IntegerField()
    upcoming_lessons = StudentDashboardUpcomingLessonSerializer(many=True)
    learning_progress = StudentDashboardProgressSerializer(many=True)
    homework_tasks = StudentDashboardHomeworkSerializer(many=True)
