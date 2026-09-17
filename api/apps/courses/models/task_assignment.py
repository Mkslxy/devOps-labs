from django.db import models


class TaskAssignment(models.Model):
    task = models.ForeignKey(
        'courses.Task',
        on_delete=models.CASCADE,
        related_name='assignments'
    )

    group = models.ForeignKey(
        'classes.Group',
        on_delete=models.CASCADE,
        related_name='task_assignments'
    )

    grade_column = models.OneToOneField(
        'gradebook.GradeColumn',
        on_delete=models.CASCADE,
        related_name='task_assignment'
    )

    class Meta:
        db_table = 'task_assignments'
        unique_together = ('task', 'group')
