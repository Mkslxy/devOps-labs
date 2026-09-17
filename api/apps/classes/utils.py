import re
from datetime import datetime, time, timezone
from zoneinfo import ZoneInfo

from rest_framework import serializers
from dateutil.rrule import rrule, WEEKLY, MO, TU, WE, TH, FR, SA, SU

WEEKDAYS_MAP = {
    0: MO, 1: TU, 2: WE, 3: TH, 4: FR, 5: SA, 6: SU
}
KYIV_TZ = ZoneInfo("Europe/Kiev")


class StrictDateTimeField(serializers.DateTimeField):
    def to_internal_value(self, value):
        has_timezone = re.search(r'(Z|[+-]\d{2}:?\d{2})$', str(value))

        if not has_timezone:
            raise serializers.ValidationError(
                "Wrong format. DateTime should be ISO-8601 format ('2025-12-15T10:10:10Z' "
                "or '2025-12-15T10:10:10+02:00')."
            )

        return super().to_internal_value(value)


def generate_dates_for_rule(start_date, end_date, day_code, lesson_time):
    if day_code not in WEEKDAYS_MAP:
        return []

    dtstart = datetime.combine(start_date, lesson_time).replace(tzinfo=timezone.utc)
    until_datetime = datetime.combine(end_date, time.max).replace(tzinfo=timezone.utc)

    dates = list(rrule(
        WEEKLY,
        dtstart=dtstart,
        until=until_datetime,
        byweekday=WEEKDAYS_MAP[day_code]
    ))

    return dates


def convert_to_kyiv_tz(dt: datetime):
    return dt.astimezone(KYIV_TZ)
