import { addDays, endOfDay, isSameDay, parseISO, startOfDay, startOfWeek } from "date-fns";
import { toDate } from "../day-view/day.utils";
import {IEvent} from "@/components/calendar/interfaces";
export function getWeekDays(date: Date, opts?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }) {
    const weekStartsOn = opts?.weekStartsOn ?? 1;
    const start = startOfWeek(date, { weekStartsOn });
    return Array.from({ length: 7 }, (_, i) => startOfDay(addDays(start, i)));
}

export function isAllDayLike(e: IEvent) {
    const s = toDate(e.startDate);
    const en = toDate(e.endDate);

    const s0 = startOfDay(s);
    const e0 = startOfDay(en);

    if (!isSameDay(s0, e0)) return true;

    if (s.getHours() === 0 && s.getMinutes() === 0 && en.getHours() === 0 && en.getMinutes() === 0) return true;

    const dur = en.getTime() - s.getTime();
    if (dur >= 23 * 60 * 60 * 1000) return true;

    return false;
}

export function splitWeekEvents(events: IEvent[], days: Date[]) {
    const allDayEvents: IEvent[] = [];
    const timedEventsByDay = new Map<string, IEvent[]>();

    for (const d of days) timedEventsByDay.set(d.toDateString(), []);

    for (const e of events) {
        if (isAllDayLike(e)) {
            allDayEvents.push(e);
            continue;
        }

        const s = startOfDay(toDate(e.startDate));
        const day = days.find((d) => isSameDay(startOfDay(d), s));
        if (!day) continue;

        timedEventsByDay.get(day.toDateString())!.push(e);
    }

    return { allDayEvents, timedEventsByDay };
}

export function calculateWeekAllDayPositions(allDayEvents: IEvent[], days: Date[]) {
    const weekStart = startOfDay(days[0]);
    const weekEnd = endOfDay(days[6]);

    const items = allDayEvents
        .map((e) => {
            const s = startOfDay(toDate(e.startDate));
            const en = endOfDay(toDate(e.endDate));
            return { e, s, en };
        })
        .filter(({ s, en }) => !(en < weekStart || s > weekEnd))
        .sort((a, b) => a.s.getTime() - b.s.getTime() || b.en.getTime() - a.en.getTime());

    const rows: Array<Array<[number, number]>> = [];
    const positions: Record<string, number> = {};

    const toIndex = (d: Date) => {
        for (let i = 0; i < days.length; i++) {
            if (isSameDay(days[i], d)) return i;
        }
        return -1;
    };

    for (const { e, s, en } of items) {
        const clampedStart = s < weekStart ? weekStart : s;
        const clampedEnd = en > weekEnd ? weekEnd : en;

        const startIdx = toIndex(startOfDay(clampedStart));
        const endIdx = toIndex(startOfDay(clampedEnd));
        if (startIdx === -1 || endIdx === -1) continue;

        let rowIndex = 0;
        while (true) {
            if (!rows[rowIndex]) rows[rowIndex] = [];
            const conflicts = rows[rowIndex].some(([a, b]) => !(endIdx < a || startIdx > b));
            if (!conflicts) {
                rows[rowIndex].push([startIdx, endIdx]);
                positions[String(e.id)] = rowIndex;
                break;
            }
            rowIndex++;
        }
    }

    return positions;
}

