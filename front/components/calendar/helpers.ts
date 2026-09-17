import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { TCalendarView } from "./types";
import { uk } from "date-fns/locale";
import {ICalendarCell, IEvent} from "@/components/calendar/interfaces";

const FORMAT_STRING = "dd MMM, yyyy";

export function rangeText(view: TCalendarView, date: Date): string {
  let start: Date;
  let end: Date;

  switch (view) {
    case "month":
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
    case "week":
      start = startOfWeek(date);
      end = endOfWeek(date);
      break;
    case "day":
      return format(date, FORMAT_STRING, { locale: uk });
    case "year":
      start = startOfYear(date);
      end = endOfYear(date);
      break;
    case "agenda":
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
    default:
      return "Помилка форматування";
  }

  return `${format(start, FORMAT_STRING, { locale: uk })} - ${format(
    end,
    FORMAT_STRING,
    { locale: uk }
  )}`;
}

export function navigateDate(
  date: Date,
  view: TCalendarView,
  direction: "previous" | "next"
): Date {
  const operations: Record<TCalendarView, (d: Date, n: number) => Date> = {
    month: direction === "next" ? addMonths : subMonths,
    week: direction === "next" ? addWeeks : subWeeks,
    day: direction === "next" ? addDays : subDays,
    year: direction === "next" ? addYears : subYears,
    agenda: direction === "next" ? addMonths : subMonths,
  };

  return operations[view](date, 1);
}

export function getEventsCount(
    events: IEvent[],
    date: Date,
    view: TCalendarView
): number {
  if (!events?.length) return 0;

  switch (view) {
    case "day":
      return events.filter((e) => isSameDay(parseISO(e.startDate), date)).length;

    case "week":
      return getEventsForWeek(events, date).length;

    case "month":
    case "agenda":
      return getEventsForMonth(events, date).length;

    case "year":
      return getEventsForYear(events, date).length;

    default:
      return 0;
  }
}

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const daysInMonth = endOfMonth(selectedDate).getDate(); // Faster than new Date(year, month + 1, 0)
  const firstDayOfMonth = startOfMonth(selectedDate).getDay();
  const daysInPrevMonth = endOfMonth(new Date(year, month - 1)).getDate();
  const totalDays = firstDayOfMonth + daysInMonth;

  const prevMonthCells = Array.from({ length: firstDayOfMonth }, (_, i) => ({
    day: daysInPrevMonth - firstDayOfMonth + i + 1,
    currentMonth: false,
    date: new Date(year, month - 1, daysInPrevMonth - firstDayOfMonth + i + 1),
  }));

  const currentMonthCells = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    currentMonth: true,
    date: new Date(year, month, i + 1),
  }));

  const nextMonthCells = Array.from(
    { length: (7 - (totalDays % 7)) % 7 },
    (_, i) => ({
      day: i + 1,
      currentMonth: false,
      date: new Date(year, month + 1, i + 1),
    })
  );

  return [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];
}

export function calculateMonthEventPositions(
    multiDayEvents: IEvent[],
    singleDayEvents: IEvent[],
    selectedDate: Date
): Record<string, number> {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const eventPositions: Record<string, number> = {};
  const occupiedPositions: Record<string, boolean[]> = {};

  eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((day) => {
    occupiedPositions[startOfDay(day).toISOString()] = [false, false, false];
  });

  const sortedEvents = [
    ...multiDayEvents.sort((a, b) => {
      const aDuration = differenceInDays(parseISO(a.endDate), parseISO(a.startDate));
      const bDuration = differenceInDays(parseISO(b.endDate), parseISO(b.startDate));

      return (
          bDuration - aDuration ||
          parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
      );
    }),
    ...singleDayEvents.sort(
        (a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
    ),
  ];

  sortedEvents.forEach((event) => {
    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);

    const eventDays = eachDayOfInterval({
      start: eventStart < monthStart ? monthStart : eventStart,
      end: eventEnd > monthEnd ? monthEnd : eventEnd,
    });

    let position = -1;

    for (let i = 0; i < 3; i++) {
      if (
          eventDays.every((day) => {
            const dayKey = startOfDay(day).toISOString();
            const dayPositions = occupiedPositions[dayKey];
            return dayPositions && !dayPositions[i];
          })
      ) {
        position = i;
        break;
      }
    }

    if (position !== -1) {
      eventDays.forEach((day) => {
        const dayKey = startOfDay(day).toISOString();
        occupiedPositions[dayKey][position] = true;
      });

      eventPositions[String(event.id)] = position;
    }
  });

  return eventPositions;
}

export function getMonthCellEvents(
    date: Date,
    events: IEvent[],
    eventPositions: Record<string, number>
) {
  const dayStart = startOfDay(date);

  const eventsForDate = events.filter((event) => {
    const eventStart = startOfDay(parseISO(event.startDate));
    const eventEnd = startOfDay(parseISO(event.endDate));

    return eventStart <= dayStart && eventEnd >= dayStart;
  });

  return eventsForDate
      .map((event) => ({
        ...event,
        position: eventPositions[String(event.id)] ?? -1,
        isMultiDay: event.startDate !== event.endDate,
      }))
      .sort((a, b) => {
        if (a.isMultiDay && !b.isMultiDay) return -1;
        if (!a.isMultiDay && b.isMultiDay) return 1;
        return a.position - b.position;
      });
}

export function formatTime(
  date: Date | string,
  use24HourFormat: boolean
): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsedDate)) return "";
  return format(parsedDate, use24HourFormat ? "HH:mm" : "h:mm a");
}

export const getWeekDates = (date: Date): Date[] => {
  const startDate = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
};

export const getEventsForWeek = (events: IEvent[], date: Date): IEvent[] => {
  const weekDates = getWeekDates(date);
  const startOfWeekDate = weekDates[0];
  const endOfWeekDate = weekDates[6];

  return events.filter((event) => {
    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);
    return (
      isValid(eventStart) &&
      isValid(eventEnd) &&
      eventStart <= endOfWeekDate &&
      eventEnd >= startOfWeekDate
    );
  });
};

export const getEventsForMonth = (events: IEvent[], date: Date): IEvent[] => {
  const startOfMonthDate = startOfMonth(date);
  const endOfMonthDate = endOfMonth(date);

  return events.filter((event) => {
    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);
    return (
      isValid(eventStart) &&
      isValid(eventEnd) &&
      eventStart <= endOfMonthDate &&
      eventEnd >= startOfMonthDate
    );
  });
};

export const getEventsForYear = (events: IEvent[], date: Date): IEvent[] => {
  if (!events || !Array.isArray(events) || !isValid(date)) return [];

  const startOfYearDate = startOfYear(date);
  const endOfYearDate = endOfYear(date);

  return events.filter((event) => {
    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);
    return (
      isValid(eventStart) &&
      isValid(eventEnd) &&
      eventStart <= endOfYearDate &&
      eventEnd >= startOfYearDate
    );
  });
};

export const toCapitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
