from django.db import transaction
from django.utils import timezone

from apps.classes.models import Group
from apps.courses.models import TaskAssignment, Task
from apps.gradebook.models import GradeColumn


def assign_task_to_group(task, group):
    if TaskAssignment.objects.filter(task=task, group=group).exists():
        return

    with transaction.atomic():
        column = GradeColumn.objects.create(
            group=group,
            title=task.title,
            date=task.deadline
        )

        TaskAssignment.objects.create(
            task=task,
            group=group,
            grade_column=column,
        )


def bulk_assign_new_task_to_groups(task: Task):
    if not task.topic or not task.topic.module.course:
        return

    course = task.topic.module.course

    groups = Group.objects.filter(course=course).exclude(
        task_assignments__task=task
    )

    if not groups.exists():
        return

    with transaction.atomic():
        columns = [
            GradeColumn(
                group=group,
                title=task.title,
                date=task.deadline or timezone.now().date()
            )
            for group in groups
        ]
        created_columns = GradeColumn.objects.bulk_create(columns, batch_size=500)

        assignments = [
            TaskAssignment(
                task=task,
                group=group,
                grade_column=column,
            )
            for group, column in zip(groups, created_columns)
        ]

        TaskAssignment.objects.bulk_create(assignments, batch_size=500)


def bulk_assign_course_content_to_group(group):
    if not group.course:
        return

    tasks = Task.objects.filter(topic__module__course=group.course).exclude(
        assignments__group=group
    ).order_by('id')

    if not tasks.exists():
        return

    with transaction.atomic():
        columns = [
            GradeColumn(
                group=group,
                title=task.title,
                date=task.deadline or timezone.now().date()
            )
            for task in tasks
        ]
        created_columns = GradeColumn.objects.bulk_create(columns, batch_size=500)

        assignments = [
            TaskAssignment(
                task=task,
                group=group,
                grade_column=column,
            )
            for task, column in zip(tasks, created_columns)
        ]

        TaskAssignment.objects.bulk_create(assignments, batch_size=500)


def bulk_update_task_in_groups(task: Task):
    updated_count = GradeColumn.objects.filter(
        task_assignment__task=task
    ).update(title=task.title)

    return updated_count
