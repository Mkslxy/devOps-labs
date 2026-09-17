from celery import shared_task

from apps.core.email.services import send_email


@shared_task
def send_email_task(subject, message, recipient_list):
    send_email(
        subject=subject,
        message=message,
        recipient_list=recipient_list,
    )
