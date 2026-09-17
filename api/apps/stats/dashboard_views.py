from datetime import timedelta
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.classes.models.group import Group, GroupStatus
from apps.classes.models.lesson import Lesson, LessonStatus
from apps.crm.models import Lead
from apps.crm.models.lead import LeadStatus
from apps.stats.dashboard_serializers import ManagerDashboardSerializer, TeacherDashboardSerializer, StudentDashboardSerializer
from apps.users.models import User
from apps.classes.models.group_student import GroupStudent, GroupStudentStatus
from apps.homework.models.homework_submission import HomeworkSubmission
from apps.core.utils import HasPermission
from apps.stats.services import get_attendance_stats, get_tests_passed


@extend_schema(tags=['Stats/Dashboard'])
class ManagerDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Manager dashboard statistics",
        responses={200: ManagerDashboardSerializer},
    )
    def get(self, request):
        now = timezone.now()

        total_students = User.objects.filter(role__slug='student', is_active=True).count()
        total_teachers = User.objects.filter(role__slug='teacher', is_active=True).count()
        total_groups = Group.objects.filter(status=GroupStatus.ACTIVE).count()
        new_leads = Lead.objects.filter(status=LeadStatus.NEW).count()

        completed_lessons_this_month = Lesson.objects.filter(
            status=LessonStatus.COMPLETED,
            start_time__year=now.year,
            start_time__month=now.month,
        ).count()

        recent_leads_qs = Lead.objects.order_by('-created_at')[:5]
        recent_leads = [
            {
                'id': lead.id,
                'name': lead.name,
                'phone': lead.phone,
                'status': lead.status,
                'source': lead.source,
                'created_at': lead.created_at,
            }
            for lead in recent_leads_qs
        ]

        # Calculate chart data for the last 7 days
        seven_days_ago = now - timedelta(days=6) # 7 days including today
        seven_days_ago_start = seven_days_ago.replace(hour=0, minute=0, second=0, microsecond=0)
        
        leads_by_day = Lead.objects.filter(created_at__gte=seven_days_ago_start)\
            .annotate(date=TruncDate('created_at'))\
            .values('date')\
            .annotate(count=Count('id'))\
            .order_by('date')
            
        lessons_by_day = Lesson.objects.filter(start_time__gte=seven_days_ago_start, status=LessonStatus.COMPLETED)\
            .annotate(date=TruncDate('start_time'))\
            .values('date')\
            .annotate(count=Count('id'))\
            .order_by('date')

        leads_dict = {item['date'].strftime('%Y-%m-%d'): item['count'] for item in leads_by_day}
        lessons_dict = {item['date'].strftime('%Y-%m-%d'): item['count'] for item in lessons_by_day}
        
        chart_data = []
        for i in range(7):
            d = (seven_days_ago_start + timedelta(days=i)).strftime('%Y-%m-%d')
            # Short format for display like 'Jun 01'
            display_d = (seven_days_ago_start + timedelta(days=i)).strftime('%b %d')
            chart_data.append({
                'date': d,
                'display_date': display_d,
                'leads': leads_dict.get(d, 0),
                'lessons': lessons_dict.get(d, 0),
            })

        data = {
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_groups': total_groups,
            'new_leads': new_leads,
            'completed_lessons_this_month': completed_lessons_this_month,
            'recent_leads': recent_leads,
            'chart_data': chart_data,
        }

        serializer = ManagerDashboardSerializer(data)
        return Response(serializer.data)


@extend_schema(tags=['Stats/Dashboard'])
class TeacherDashboardView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permissions = ['stats.read_teacher']

    @extend_schema(
        summary="Teacher dashboard statistics",
        responses={200: TeacherDashboardSerializer},
    )
    def get(self, request):
        now = timezone.now()
        teacher = request.user

        # Active Students
        active_groups_qs = Group.objects.filter(teacher=teacher, status=GroupStatus.ACTIVE)
        active_groups_count = active_groups_qs.count()
        active_students_count = GroupStudent.objects.filter(group__in=active_groups_qs).values('student').distinct().count()

        # Lessons this week
        start_of_week = now - timedelta(days=now.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = start_of_week + timedelta(days=7)
        
        lessons_this_week = Lesson.objects.filter(
            teacher=teacher,
            start_time__gte=start_of_week,
            start_time__lt=end_of_week,
        )
        planned_lessons_this_week = lessons_this_week.count()
        completed_lessons_this_week = lessons_this_week.filter(status=LessonStatus.COMPLETED).count()

        # Hours Worked (this month)
        lessons_this_month = Lesson.objects.filter(
            teacher=teacher,
            start_time__year=now.year,
            start_time__month=now.month,
            status=LessonStatus.COMPLETED
        )
        hours_worked_this_month = 0
        for lesson in lessons_this_month:
            hours_worked_this_month += (lesson.end_time - lesson.start_time).total_seconds() / 3600

        # Upcoming Lessons
        upcoming_lessons_qs = Lesson.objects.select_related('group').filter(
            teacher=teacher,
            start_time__gte=now,
            status__in=[LessonStatus.SCHEDULED]
        ).order_by('start_time')[:5]
        
        lesson_group_ids = [l.group_id for l in upcoming_lessons_qs if l.group_id]
        if lesson_group_ids:
            group_student_counts = GroupStudent.objects.filter(group_id__in=lesson_group_ids).values('group_id').annotate(count=Count('id'))
            counts_map = {item['group_id']: item['count'] for item in group_student_counts}
        else:
            counts_map = {}
            
        upcoming_lessons = []
        for lesson in upcoming_lessons_qs:
            group_name = lesson.group.name if lesson.group else "Індивідуальний"
            students_count = counts_map.get(lesson.group_id, 1) if lesson.group_id else 1
            l_type = "Груповий" if lesson.group and students_count > 1 else "Індивідуальний"
            time_str = f"{timezone.localtime(lesson.start_time).strftime('%H:%M')} - {timezone.localtime(lesson.end_time).strftime('%H:%M')}"
            
            upcoming_lessons.append({
                "time": time_str,
                "student": group_name,
                "students": students_count,
                "type": l_type,
            })

        # Tasks for review
        tasks_qs = HomeworkSubmission.objects.select_related(
            'student', 
            'homework__lesson__group', 
            'homework__lesson__group__course'
        ).filter(
            homework__lesson__teacher=teacher,
            grade__isnull=True
        ).order_by('-created_at')[:5]
        
        tasks_for_review = []
        for task in tasks_qs:
            diff_hours = int((now - task.created_at).total_seconds() / 3600)
            if diff_hours < 24:
                submitted_str = f"{diff_hours} годин тому" if diff_hours > 0 else "Щойно"
            else:
                submitted_str = f"{diff_hours // 24} днів тому"
                
            tasks_for_review.append({
                "student": task.student.get_full_name(),
                "assignment": task.homework.title,
                "submitted": submitted_str,
                "course": task.homework.lesson.group.course.title if task.homework.lesson.group and task.homework.lesson.group.course else "Інше",
            })

        # Recent students
        students_qs = GroupStudent.objects.select_related('student', 'group__course').filter(
            group__in=active_groups_qs
        ).order_by('?')[:5]
        recent_students = []
        for gs in students_qs:
            recent_students.append({
                "name": gs.student.get_full_name(),
                "course": gs.group.course.title if gs.group.course else "Інше",
                "progress": 0,
                "attendance": "0%"
            })

        data = {
            "active_students": active_students_count,
            "active_groups": active_groups_count,
            "lessons_this_week": completed_lessons_this_week,
            "planned_lessons_this_week": planned_lessons_this_week,
            "hours_worked_this_month": int(hours_worked_this_month),
            "upcoming_lessons": upcoming_lessons,
            "tasks_for_review": tasks_for_review,
            "recent_students": recent_students,
        }

        serializer = TeacherDashboardSerializer(data)
        return Response(serializer.data)


@extend_schema(tags=['Stats/Dashboard'])
class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Student dashboard statistics",
        responses={200: StudentDashboardSerializer},
    )
    def get(self, request):
        now = timezone.now()
        student = request.user

        # Active Courses
        active_group_students = GroupStudent.objects.filter(student=student, status=GroupStudentStatus.ACTIVE).select_related('group', 'group__course', 'group__teacher')
        active_courses = active_group_students.count()

        # Lessons left
        active_groups = [gs.group for gs in active_group_students]
        planned_lessons_qs = Lesson.objects.filter(
            group__in=active_groups,
            status=LessonStatus.SCHEDULED,
            start_time__gte=now
        )
        lessons_left = planned_lessons_qs.count()
        lessons_total_paid = max(lessons_left, 24)

        # Attendance percent
        attendance_stats = get_attendance_stats(student)
        attendance_percent = int(attendance_stats.get('present_percent', 0))

        # Achievements
        achievements_count = get_tests_passed(student)

        # Upcoming lessons
        upcoming_lessons_qs = planned_lessons_qs.select_related('group__course', 'teacher').order_by('start_time')[:3]
        upcoming_lessons = []
        for lesson in upcoming_lessons_qs:
            course_name = lesson.group.course.title if lesson.group and lesson.group.course else "Без курсу"
            teacher_name = lesson.teacher.get_full_name() if lesson.teacher else "Не призначено"
            time_str = ""
            
            diff_days = (lesson.start_time.date() - now.date()).days
            if diff_days == 0:
                time_str = f"Сьогодні о {timezone.localtime(lesson.start_time).strftime('%H:%M')}"
            elif diff_days == 1:
                time_str = f"Завтра о {timezone.localtime(lesson.start_time).strftime('%H:%M')}"
            else:
                weekdays_ua = ["Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота", "Неділя"]
                weekday = weekdays_ua[lesson.start_time.weekday()]
                time_str = f"{weekday} о {timezone.localtime(lesson.start_time).strftime('%H:%M')}"
                
            duration_mins = int((lesson.end_time - lesson.start_time).total_seconds() / 60)
            
            upcoming_lessons.append({
                "course": course_name,
                "teacher": teacher_name,
                "time": time_str,
                "duration": f"{duration_mins} хв"
            })

        # Learning progress
        active_group_ids = [gs.group_id for gs in active_group_students]
        if active_group_ids:
            lessons_stats = Lesson.objects.filter(group_id__in=active_group_ids).values('group_id').annotate(
                total=Count('id'),
                completed=Count('id', filter=Q(status=LessonStatus.COMPLETED))
            )
            stats_map = {item['group_id']: item for item in lessons_stats}
        else:
            stats_map = {}

        learning_progress = []
        for gs in active_group_students:
            course_name = gs.group.course.title if gs.group.course else "Без курсу"
            group_stats = stats_map.get(gs.group_id, {'completed': 0, 'total': 0})
            group_lessons_completed = group_stats['completed']
            group_lessons_total = group_stats['total']
            
            progress = int((group_lessons_completed / group_lessons_total * 100) if group_lessons_total > 0 else 0)
            
            learning_progress.append({
                "course": course_name,
                "progress": progress,
                "lessons_completed": group_lessons_completed,
                "lessons_total": group_lessons_total,
            })

        # Homework tasks
        tasks_qs = HomeworkSubmission.objects.select_related('homework__lesson__group__course').filter(
            student=student,
            grade__isnull=True
        ).order_by('-created_at')[:3]
        
        homework_tasks = []
        for task in tasks_qs:
            course_name = task.homework.lesson.group.course.title if task.homework.lesson.group and task.homework.lesson.group.course else "Інше"
            diff_hours = int((now - task.created_at).total_seconds() / 3600)
            
            status_val = "normal"
            if diff_hours > 48:
                deadline_str = "Давно"
                status_val = "urgent"
            elif diff_hours > 24:
                deadline_str = "Вчора"
            else:
                deadline_str = "Сьогодні"
                
            homework_tasks.append({
                "title": task.homework.title,
                "course": course_name,
                "deadline": deadline_str,
                "status": status_val
            })

        data = {
            "active_courses": active_courses,
            "lessons_left": lessons_left,
            "lessons_total_paid": lessons_total_paid,
            "attendance_percent": attendance_percent,
            "achievements_count": achievements_count,
            "upcoming_lessons": upcoming_lessons,
            "learning_progress": learning_progress,
            "homework_tasks": homework_tasks,
        }

        serializer = StudentDashboardSerializer(data)
        return Response(serializer.data)

