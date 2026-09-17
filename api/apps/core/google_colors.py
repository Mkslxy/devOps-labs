from django.db import models


class GoogleCalendarColor(models.TextChoices):
    LAVENDER = '1', '#7986cb'
    SAGE = '2', '#33b679'
    GRAPE = '3', '#8e24aa'
    FLAMINGO = '4', '#e67c73'
    BANANA = '5', '#f6bf26'
    TANGERINE = '6', '#f4511e'
    PEACOCK = '7', '#039be5'
    GRAPHITE = '8', '#616161'
    BLUEBERRY = '9', '#3f51b5'
    BASIL = '10', '#0b8043'
    TOMATO = '11', '#d50000'

    @classmethod
    def get_hex(cls, color_id):
        for value, label in cls.choices:
            if value == color_id:
                return label
        return '#8e24aa'
