from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.courses.models import Task
from apps.courses.services import bulk_assign_new_task_to_groups, bulk_update_task_in_groups


@receiver(post_save, sender=Task)
def task_post_save_handler(sender, instance, created, **kwargs):
    if created:
        bulk_assign_new_task_to_groups(instance)
    else:
        bulk_update_task_in_groups(instance)
