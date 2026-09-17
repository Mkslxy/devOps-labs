import { differenceInMinutes, parseISO } from "date-fns";

export function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}

export function snapToStepMinutes(mins: number, step = 30) {
    return Math.round(mins / step) * step;
}

export function toDate(v: string | Date) {
    return typeof v === "string" ? parseISO(v) : v;
}

export function minutesFromDayStart(d: Date, dayStart: Date) {
    return differenceInMinutes(d, dayStart);
}

export function intersects(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && bStart < aEnd;
}
