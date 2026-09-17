from django.core.mail import send_mail

from UniSchool import settings


def send_email(subject, message, recipient_list):
    return send_mail(
        subject=subject,
        message=message,
        from_email=f"UniSchool <{settings.EMAIL_HOST_USER}>",
        recipient_list=recipient_list,
        fail_silently=True,
    )
