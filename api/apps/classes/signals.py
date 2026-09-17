from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.classes.models import Group
from apps.courses.services import bulk_assign_course_content_to_group


@receiver(post_save, sender=Group)
def group_post_save_handler(sender, instance, created, **kwargs):
    if instance.course:
        bulk_assign_course_content_to_group(instance)
