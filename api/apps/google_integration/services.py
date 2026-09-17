import logging
logger = logging.getLogger(__name__)

import requests
from django.conf import settings
from django.utils import timezone
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import Flow
from rest_framework.exceptions import ValidationError

from apps.classes.models import Lesson


class GoogleCalendarService:
    CLIENT_SECRETS_FILE = settings.GOOGLE_OAUTH2_CLIENT_SECRETS_JSON
    SCOPES = settings.GOOGLE_SCOPES
    REDIRECT_URI = settings.GOOGLE_REDIRECT_URI

    @staticmethod
    def get_authorization_url():
        flow = Flow.from_client_secrets_file(
            GoogleCalendarService.CLIENT_SECRETS_FILE,
            scopes=GoogleCalendarService.SCOPES,
            redirect_uri=GoogleCalendarService.REDIRECT_URI
        )
        auth_url, _ = flow.authorization_url(access_type='offline', prompt='consent')
        return auth_url

    @staticmethod
    def get_tokens(code):
        flow = Flow.from_client_secrets_file(
            GoogleCalendarService.CLIENT_SECRETS_FILE,
            scopes=GoogleCalendarService.SCOPES,
            redirect_uri=GoogleCalendarService.REDIRECT_URI
        )
        flow.fetch_token(code=code)
        return flow.credentials

    @staticmethod
    def disconnect_user(user):
        if not user or not user.google_refresh_token:
            return

        token_to_revoke = user.google_refresh_token

        try:
            requests.post(
                'https://oauth2.googleapis.com/revoke',
                params={'token': token_to_revoke},
                headers={'content-type': 'application/x-www-form-urlencoded'},
                timeout=5
            )
        except Exception:
            pass

        user.google_refresh_token = None
        user.save(update_fields=['google_refresh_token'])

    @staticmethod
    def _get_service(user):
        if not user:
            raise ValidationError({"teacher": "Teacher is not assigned."})

        if not user.google_refresh_token:
            raise ValidationError({"teacher": f"Teacher {user.email} didn't connect Google Calendar."})

        try:
            creds = Credentials(
                token=None,
                refresh_token=user.google_refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_OAUTH2_CLIENT_ID,
                client_secret=settings.GOOGLE_OAUTH2_CLIENT_SECRET
            )
            return build('calendar', 'v3', credentials=creds)
        except Exception as e:
            raise ValidationError({"google_error": f"Google Authorization error: {str(e)}"})

    @staticmethod
    def create_event(lesson):
        teacher = lesson.teacher

        service = GoogleCalendarService._get_service(teacher)

        attendees = []
        if lesson.group:
            for student in lesson.group.custom_user_set.all():
                if student.email:
                    attendees.append({
                        'email': student.email,
                        'responseStatus': 'accepted'
                    })

        event_body = {
            'summary': f"{lesson.group.name}: {lesson.topic}",
            'description': lesson.description or "",
            'start': {'dateTime': lesson.start_time.isoformat(), 'timeZone': 'Europe/Kiev'},
            'end': {'dateTime': lesson.end_time.isoformat(), 'timeZone': 'Europe/Kiev'},
            'attendees': attendees,
            'colorId': lesson.color_id,
            'extendedProperties': {
                'private': {
                    'app_id': 'UniSchool_LMS',
                    'lesson_id': str(lesson.id),
                }
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 10},
                    {'method': 'email', 'minutes': 60},
                ],
            },
        }

        if lesson.is_online:
            event_body["conferenceData"] = {
                'createRequest': {
                    'requestId': f"lesson-{lesson.id}",
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            }

        try:
            kwargs = {
                "calendarId": "primary",
                "body": event_body,
                "sendUpdates": "all",
            }

            if lesson.is_online:
                kwargs["conferenceDataVersion"] = 1

            event = service.events().insert(**kwargs).execute()

            return {
                'google_id': event.get('id'),
                'meet_link': event.get('hangoutLink'),
                'html_link': event.get('htmlLink')
            }
        except Exception as e:
            raise ValidationError({"google_error": f"Google API Error: {str(e)}"})

    @staticmethod
    def update_event(lesson):
        if not lesson.google_event_id or not lesson.teacher:
            return

        service = GoogleCalendarService._get_service(lesson.teacher)

        attendees = [{'email': s.email} for s in lesson.group.custom_user_set.all() if s.email]

        event_body = {
            'summary': f"{lesson.group.name}: {lesson.topic}",
            'description': lesson.description or "",
            'start': {'dateTime': lesson.start_time.isoformat(), 'timeZone': 'Europe/Kiev'},
            'end': {'dateTime': lesson.end_time.isoformat(), 'timeZone': 'Europe/Kiev'},
            'attendees': attendees,
            'colorId': str(lesson.color_id or "3"),
        }

        kwargs = {
            "calendarId": "primary",
            "eventId": lesson.google_event_id,
            "body": event_body,
            "sendUpdates": "all",
        }

        if lesson.is_online and not lesson.meet_link:
            event_body["conferenceData"] = {
                "createRequest": {
                    "requestId": f"lesson-{lesson.id}",
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            }
            kwargs["conferenceDataVersion"] = 1

        elif not lesson.is_online and lesson.meet_link:
            event_body["conferenceData"] = None

        try:
            event = service.events().patch(**kwargs).execute()

            lesson.meet_link = event.get("hangoutLink")
            lesson.html_link = event.get("htmlLink")
            lesson.last_synced_at = timezone.now()
            lesson.save(update_fields=["meet_link", "html_link", "last_synced_at"])

        except Exception as e:
            raise ValidationError({"google_error": f"Google Lesson Update Error: {str(e)}"})

    @staticmethod
    def delete_event(instance):
        if not instance.google_event_id: return

        connected_user = instance.teacher if isinstance(instance, Lesson) else instance.created_by

        try:
            service = GoogleCalendarService._get_service(connected_user)
            service.events().delete(
                calendarId='primary',
                eventId=instance.google_event_id,
                sendUpdates='all'
            ).execute()
        except Exception as e:
            logger.error("Error deleting event:", str(e))

    @staticmethod
    def batch_create_events(lessons_list, user):
        service = GoogleCalendarService._get_service(user)
        results = {}

        def callback(request_id, response, exception):
            if exception is not None:
                logger.error(f"Batch Error for lesson {request_id}: {exception}")
            else:
                results[int(request_id)] = {
                    'google_id': response.get('id'),
                    'meet_link': response.get('hangoutLink'),
                    'html_link': response.get('htmlLink'),
                }

        batch = service.new_batch_http_request(callback=callback)

        for lesson in lessons_list:
            attendees = []
            if lesson.group:
                for student in lesson.group.custom_user_set.all():
                    if student.email:
                        attendees.append({'email': student.email, 'responseStatus': 'accepted'})

            event_body = {
                'summary': f"{lesson.group.name}: {lesson.topic}",
                'description': lesson.description or "",
                'start': {'dateTime': lesson.start_time.isoformat(), 'timeZone': 'Europe/Kiev'},
                'end': {'dateTime': lesson.end_time.isoformat(), 'timeZone': 'Europe/Kiev'},
                'attendees': attendees,
                'colorId': getattr(lesson, 'color_id', '1'),
                'extendedProperties': {
                    'private': {
                        'app_id': 'UniSchool_LMS',
                        'lesson_id': str(lesson.id),
                    }
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'popup', 'minutes': 10},
                        {'method': 'email', 'minutes': 60},
                    ],
                },
            }

            if lesson.is_online:
                event_body["conferenceData"] = {
                    'createRequest': {
                        'requestId': f"meet_{lesson.id}",
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                    }
                }

            batch.add(
                service.events().insert(
                    calendarId='primary',
                    body=event_body,
                    conferenceDataVersion=1 if lesson.is_online else 0,
                    sendUpdates='none'
                ),
                request_id=str(lesson.id)
            )

        try:
            batch.execute()
        except Exception as e:
            logger.error(f"Batch execution failed critically: {e}")
            raise ValidationError(f"Google Batch Error: {e}")

        return results

    ### INTERNAL MEETINGS
    @staticmethod
    def create_internal_meeting_event(meeting):
        created_by = meeting.created_by
        service = GoogleCalendarService._get_service(created_by)

        attendees = []
        for user in meeting.attendees.all():
            if user.email:
                attendees.append({'email': user.email, 'responseStatus': 'needsAction'})

        prefix = meeting.get_type_display() if hasattr(meeting, 'get_type_display') else "Meeting"

        event_body = {
            'summary': f"{prefix}: {meeting.title}",
            'description': meeting.description or "",
            'start': {'dateTime': meeting.start_time.isoformat(), 'timeZone': 'Europe/Kiev'},
            'end': {'dateTime': meeting.end_time.isoformat(), 'timeZone': 'Europe/Kiev'},
            'attendees': attendees,
            'colorId': meeting.color_id,
            'extendedProperties': {
                'private': {'app_id': 'UniSchool_LMS', 'internal_meeting_id': str(meeting.id)}
            },
            'reminders': {
                'useDefault': False,
                'overrides': [{'method': 'popup', 'minutes': 15}],
            },
        }

        if meeting.is_online:
            event_body["conferenceData"] = {
                'createRequest': {
                    'requestId': f"meeting-{meeting.id}",
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            }

        try:
            kwargs = {"calendarId": "primary", "body": event_body, "sendUpdates": "all"}
            if meeting.is_online:
                kwargs["conferenceDataVersion"] = 1

            event = service.events().insert(**kwargs).execute()

            return {
                'google_id': event.get('id'),
                'meet_link': event.get('hangoutLink'),
                'html_link': event.get('htmlLink')
            }
        except Exception as e:
            logger.error(f"Google API Error for Meeting: {e}")
            return None

    @staticmethod
    def update_internal_meeting_event(meeting):
        if not meeting.google_event_id or not meeting.created_by:
            return

        service = GoogleCalendarService._get_service(meeting.created_by)
        attendees = [{'email': u.email} for u in meeting.attendees.all() if u.email]

        prefix = meeting.get_type_display() if hasattr(meeting, 'get_type_display') else "Meeting"

        event_body = {
            'summary': f"{prefix}: {meeting.title}",
            'description': meeting.description or "",
            'start': {'dateTime': meeting.start_time.isoformat(), 'timeZone': 'Europe/Kiev'},
            'end': {'dateTime': meeting.end_time.isoformat(), 'timeZone': 'Europe/Kiev'},
            'attendees': attendees,
            'colorId': str(meeting.color_id or "8"),
        }

        kwargs = {"calendarId": "primary", "eventId": meeting.google_event_id, "body": event_body, "sendUpdates": "all"}

        if meeting.is_online and not meeting.meet_link:
            event_body["conferenceData"] = {
                "createRequest": {"requestId": f"meeting-{meeting.id}",
                                  "conferenceSolutionKey": {"type": "hangoutsMeet"}}
            }
            kwargs["conferenceDataVersion"] = 1
        elif not meeting.is_online and meeting.meet_link:
            event_body["conferenceData"] = None

        try:
            event = service.events().patch(**kwargs).execute()
            meeting.meet_link = event.get("hangoutLink")
            meeting.html_link = event.get("htmlLink")
            meeting.save(update_fields=["meet_link", "html_link"])
        except Exception as e:
            logger.error(f"Google Meeting Update Error: {e}")


class GoogleTasksService:

    @staticmethod
    def _get_service(user):
        if not user:
            return None

        if not user.google_refresh_token:
            return None

        try:
            creds = Credentials(
                token=None,
                refresh_token=user.google_refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_OAUTH2_CLIENT_ID,
                client_secret=settings.GOOGLE_OAUTH2_CLIENT_SECRET
            )
            return build('tasks', 'v1', credentials=creds)
        except Exception as e:
            logger.error(f"Google Tasks Authorization error: {str(e)}")
            return None

    @staticmethod
    def create_task(task_instance):
        service = GoogleTasksService._get_service(task_instance.assignee)
        if not service:
            return None

        task_body = {
            'title': task_instance.title,
            'notes': task_instance.description or "",
            'status': task_instance.google_status,
        }

        if task_instance.deadline:
            task_body['due'] = task_instance.deadline.isoformat()

        try:
            result = service.tasks().insert(
                tasklist=task_instance.google_tasklist_id,
                body=task_body
            ).execute()

            task_instance.google_task_id = result.get('id')
            task_instance.save(update_fields=['google_task_id'])

            return result
        except Exception as e:
            logger.error(f"Google Tasks Create Error: {e}")
            return None

    @staticmethod
    def update_task(task_instance):
        if not task_instance.google_task_id:
            return GoogleTasksService.create_task(task_instance)

        service = GoogleTasksService._get_service(task_instance.assignee)
        if not service:
            return None

        task_body = {
            'id': task_instance.google_task_id,
            'title': task_instance.title,
            'notes': task_instance.description or "",
            'status': task_instance.google_status,
        }

        if task_instance.deadline:
            task_body['due'] = task_instance.deadline.isoformat() + 'Z'
        else:
            task_body['due'] = None

        try:
            result = service.tasks().update(
                tasklist=task_instance.google_tasklist_id,
                task=task_instance.google_task_id,
                body=task_body
            ).execute()
            return result
        except Exception as e:
            logger.error(f"Google Tasks Update Error: {e}")
            return None

    @staticmethod
    def delete_task(task_instance):
        if not task_instance.google_task_id:
            return

        service = GoogleTasksService._get_service(task_instance.assignee)
        if not service:
            return

        try:
            service.tasks().delete(
                tasklist=task_instance.google_tasklist_id,
                task=task_instance.google_task_id
            ).execute()
        except Exception as e:
            logger.error(f"Google Tasks Delete Error: {e}")
