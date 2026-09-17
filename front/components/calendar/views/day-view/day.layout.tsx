import {differenceInMinutes, startOfDay} from "date-fns";
import {max as dfMax} from "date-fns/max";
import {min as dfMin} from "date-fns/min";
import {intersects, minutesFromDayStart, toDate } from "./day.utils";
import { PositionedEvent } from "./day.types";
import { IEvent } from "../../interfaces";

export function layoutDayEvents(args: {
    events: IEvent[];
    day: Date;
    dayStartHour: number;
    dayEndHour: number;
    pxPerHour: number;
}) {
    const { events, day, dayStartHour, dayEndHour, pxPerHour } = args;

    const dayStart = startOfDay(day);

    const visibleStart = new Date(dayStart);
    visibleStart.setHours(dayStartHour, 0, 0, 0);

    const visibleEnd = new Date(dayStart);
    visibleEnd.setHours(dayEndHour, 0, 0, 0);

    const minutesVisible = differenceInMinutes(visibleEnd, visibleStart);
    const pxPerMinute = pxPerHour / 60;

    const filtered = events
        .map((e) => {
            const s = toDate(e.startDate);
            const en = toDate(e.endDate);
            return { e, s, en };
        })
        .filter(({ s, en }) => intersects(s, en, visibleStart, visibleEnd))
        .sort((a, b) => a.s.getTime() - b.s.getTime() || a.en.getTime() - b.en.getTime());

    const clusters: Array<Array<typeof filtered[number]>> = [];
    let current: Array<typeof filtered[number]> = [];
    let currentMaxEnd: Date | null = null;

    for (const item of filtered) {
        if (!current.length) {
            current = [item];
            currentMaxEnd = item.en;
            continue;
        }

        if (currentMaxEnd && item.s < currentMaxEnd) {
            current.push(item);
            currentMaxEnd = dfMax([currentMaxEnd, item.en]);
        } else {
            clusters.push(current);
            current = [item];
            currentMaxEnd = item.en;
        }
    }
    if (current.length) clusters.push(current);

    const positioned: PositionedEvent[] = [];

    for (const cluster of clusters) {
        const columns: Array<Array<typeof cluster[number]>> = [];

        for (const item of cluster) {
            let placed = false;

            for (let c = 0; c < columns.length; c++) {
                const col = columns[c];
                const last = col[col.length - 1];
                if (!intersects(item.s, item.en, last.s, last.en)) {
                    col.push(item);
                    placed = true;
                    break;
                }
            }

            if (!placed) columns.push([item]);
        }

        const colCount = columns.length;

        for (let c = 0; c < colCount; c++) {
            for (const item of columns[c]) {
                const startClamped = dfMax([item.s, visibleStart]);
                const endClamped = dfMin([item.en, visibleEnd]);

                const startMin = minutesFromDayStart(startClamped, visibleStart);
                const endMin = minutesFromDayStart(endClamped, visibleStart);

                const top = startMin * pxPerMinute;
                const height = Math.max(16, (endMin - startMin) * pxPerMinute);

                const gap = 0;
                const baseWidth = 100 / colCount;
                const width = Math.max(baseWidth - gap, 2);
                const left = baseWidth * c;

                positioned.push({
                    event: item.e,
                    top,
                    height,
                    left,
                    width,
                });
            }
        }
    }

    return {
        positioned,
        visibleStart,
        visibleEnd,
        minutesVisible,
        pxPerMinute,
    };
}

export function buildTimeLabels(day: Date, startHour: number, endHour: number) {
    const d0 = startOfDay(day);
    const out: Date[] = [];
    for (let h = startHour; h <= endHour; h++) {
        const t = new Date(d0);
        t.setHours(h, 0, 0, 0);
        out.push(t);
    }
    return out;
}

export function getMaxConcurrencyInRange(args: {
    events: IEvent[];
    rangeStart: Date;
    rangeEnd: Date;
    visibleStart: Date;
    excludeId?: IEvent["id"];
}) {
    const { events, rangeStart, rangeEnd, visibleStart, excludeId } = args;

    const points: Array<{ t: number; delta: number }> = [];

    for (const ev of events) {
        if (excludeId != null && ev.id === excludeId) continue;

        const s = toDate(ev.startDate);
        const en = toDate(ev.endDate);

        if (!intersects(s, en, rangeStart, rangeEnd)) continue;

        const sClamped = dfMax([s, rangeStart]);
        const eClamped = dfMin([en, rangeEnd]);

        const a = differenceInMinutes(sClamped, visibleStart);
        const b = differenceInMinutes(eClamped, visibleStart);

        points.push({ t: a, delta: +1 });
        points.push({ t: b, delta: -1 });
    }

    points.sort((p1, p2) => p1.t - p2.t || p1.delta - p2.delta);

    let cur = 0;
    let max = 0;
    for (const p of points) {
        cur += p.delta;
        max = Math.max(max, cur);
    }

    return max;
}
