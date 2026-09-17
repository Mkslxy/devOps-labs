import logging
from datetime import timedelta

from celery import shared_task
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from apps.classes.models import Lesson, LessonStatus
from apps.classes.utils import convert_to_kyiv_tz
from apps.telegram.models import NotificationType, NotificationLog
from apps.telegram.utils import create_notification_log, create_notification_logs_bulk
from apps.telegram.models.telegram_connection import TelegramConnection
from apps.telegram.services import TelegramMessageBroadcastingService

logger = logging.getLogger(__name__)

UA_DAYS = {0: "Понеділок", 1: "Вівторок", 2: "Середа", 3: "Четвер", 4: "П'ятниця", 5: "Субота", 6: "Неділя"}


@shared_task
def send_lesson_reminders_3h():
    now = timezone.now()
    start_window = now + timedelta(hours=3)
    end_window = start_window + timedelta(minutes=10)

    lessons = Lesson.objects.filter(
        start_time__gte=start_window,
        start_time__lt=end_window,
        status=LessonStatus.SCHEDULED
    ).select_related('group', 'teacher')

    if not lessons.exists():
        return f"No lessons found between {start_window} and {end_window}"

    count_sent = 0

    for lesson in lessons:
        log = create_notification_log(lesson, NotificationType.LESSON_REMINDER_3H)
        if not log:
            continue

        student_ids = lesson.group.groupstudent_set.filter(
            status='active'
        ).values_list('student_id', flat=True)

        if not student_ids:
            continue

        connections = TelegramConnection.objects.filter(
            user_id__in=student_ids,
            is_active=True
        ).select_related('user')

        meet_link_text = ""
        if lesson.is_online and lesson.meet_link:
            meet_link_text = f"\n🔗 <a href='{lesson.meet_link}'>Приєднатися до уроку</a>"

        local_start_time = convert_to_kyiv_tz(lesson.start_time).strftime('%H:%M')

        text = (
            f"⏰ <b>Нагадування!</b>\n"
            f"Через 3 години ({local_start_time}) заняття.\n\n"
            f"📚 <b>Група:</b> {lesson.group.name}\n"
            f"📝 <b>Тема:</b> {lesson.topic}"
            f"{meet_link_text}"
        )

        for conn in connections:
            try:
                TelegramMessageBroadcastingService.send_to_chat_sync(conn.tg_id, text)
                count_sent += 1
            except Exception as e:
                logger.error(f"Error sending 3h reminder to {conn.tg_id}: {e}")

    return f"Sent {count_sent} reminders for {lessons.count()} lessons."


@shared_task
def send_daily_evening_reminder():
    now = timezone.now()
    tomorrow = timezone.now().date() + timedelta(days=1)
    lesson_ctype = ContentType.objects.get_for_model(Lesson)

    already_notified = NotificationLog.objects.filter(
        content_type=lesson_ctype,
        type=NotificationType.LESSON_REMINDER_EVENING,
        sent_at__date=now.date()
    ).values_list('object_id', flat=True)

    lessons = Lesson.objects.filter(
        start_time__date=tomorrow,
        status=LessonStatus.SCHEDULED
    ).exclude(id__in=already_notified).select_related('group')

    if not lessons.exists():
        return "No lessons scheduled for tomorrow or reminders already sent."

    schedule_map = {}
    for lesson in lessons:
        student_ids = lesson.group.groupstudent_set.filter(
            status='active'
        ).values_list('student_id', flat=True)

        connections = TelegramConnection.objects.filter(
            user_id__in=student_ids,
            is_active=True
        )

        for conn in connections:
            if conn.tg_id not in schedule_map:
                schedule_map[conn.tg_id] = []
            schedule_map[conn.tg_id].append(lesson)

    sent_count = 0
    for tg_id, user_lessons in schedule_map.items():
        user_lessons.sort(key=lambda x: x.start_time)

        lessons_text = ""
        for l in user_lessons:
            start_str = convert_to_kyiv_tz(l.start_time).strftime('%H:%M')
            end_str = convert_to_kyiv_tz(l.end_time).strftime('%H:%M') if l.end_time else "..."

            online_icon = "💻" if l.is_online else "🏫"

            lessons_text += (
                f"🔹 <b>{start_str} - {end_str}</b> {online_icon} {l.group.name}\n"
                f"   <i>{l.topic}</i>\n"
            )

        text = (
            f"🌙 <b>Розклад на завтра ({tomorrow.strftime('%d.%m')}):</b>\n\n"
            f"{lessons_text}\n"
            f"Не запізнюйтесь! 👋"
        )

        try:
            TelegramMessageBroadcastingService.send_to_chat_sync(tg_id, text)
            sent_count += 1

            create_notification_logs_bulk(user_lessons, NotificationType.LESSON_REMINDER_EVENING)

        except Exception as e:
            logger.error(f"Error sending daily reminder to {tg_id}: {e}")

    return f"Sent daily reminders to {sent_count} students."


@shared_task
def send_weekly_schedule_reminder():
    now = timezone.now()
    next_monday = now.date() + timedelta(days=(7 - now.weekday()))
    next_sunday = next_monday + timedelta(days=6)

    lesson_ctype = ContentType.objects.get_for_model(Lesson)

    already_notified = NotificationLog.objects.filter(
        content_type=lesson_ctype,
        type=NotificationType.WEEKLY_SCHEDULE,
        sent_at__date=now.date()
    ).values_list('object_id', flat=True)

    lessons = Lesson.objects.filter(
        start_time__date__range=[next_monday, next_sunday],
        status=LessonStatus.SCHEDULED
    ).exclude(id__in=already_notified).select_related('group').order_by('start_time')

    if not lessons.exists():
        return f"No lessons scheduled for the week {next_monday} - {next_sunday}."

    # { tg_id: { date: [lesson1, lesson2] } }
    schedule_map = {}

    for lesson in lessons:
        student_ids = lesson.group.groupstudent_set.filter(
            status='active'
        ).values_list('student_id', flat=True)

        connections = TelegramConnection.objects.filter(
            user_id__in=student_ids,
            is_active=True
        )

        l_date = lesson.start_time.date()

        for conn in connections:
            if conn.tg_id not in schedule_map:
                schedule_map[conn.tg_id] = {}
            if l_date not in schedule_map[conn.tg_id]:
                schedule_map[conn.tg_id][l_date] = []
            schedule_map[conn.tg_id][l_date].append(lesson)

    sent_count = 0
    for tg_id, days in schedule_map.items():
        lessons_text = ""
        all_user_lessons = []

        for l_date in sorted(days.keys()):
            day_name = UA_DAYS.get(l_date.weekday())
            lessons_text += f"\n<b>{day_name} ({l_date.strftime('%d.%m')})</b>\n"

            for l in days[l_date]:
                all_user_lessons.append(l)
                start_str = convert_to_kyiv_tz(l.start_time).strftime('%H:%M')
                online_icon = "💻" if l.is_online else "🏫"
                lessons_text += f"  - {start_str} {online_icon} {l.group.name}\n"

        text = (
            f"🗓 <b>Твій розклад на наступний тиждень:</b>\n"
            f"{lessons_text}\n"
            f"Бажаємо продуктивного тижня! 💪"
        )

        try:
            TelegramMessageBroadcastingService.send_to_chat_sync(tg_id, text)
            sent_count += 1
            create_notification_logs_bulk(all_user_lessons, NotificationType.WEEKLY_SCHEDULE)
        except Exception as e:
            logger.error(f"Error sending weekly schedule to {tg_id}: {e}")

    return f"Sent weekly schedule to {sent_count} students. Period: {next_monday} - {next_sunday}"
