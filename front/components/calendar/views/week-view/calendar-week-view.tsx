"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    differenceInMinutes,
    format,
    isSameDay,
    isToday,
    max as dfMax,
    min as dfMin,
    startOfDay,
} from "date-fns";
import { uk } from "date-fns/locale";

import { cn } from "@/libs/utils";
import type { IEvent } from "../../interfaces";
import { useCalendar } from "../../contexts/calendar-context";
import { useMediaQuery } from "../../hooks";
import { DroppableArea } from "../../dnd/droppable-area";
import { DraggableEvent } from "../../dnd/draggable-event";
import { EventDetailsDialog } from "../../dialogs/event-details-dialog";
import { AddEditEventDialog } from "../../dialogs/add-edit-event-dialog";
import { useDragDrop } from "../../contexts/dnd-context";

import {
    DAY_START_HOUR,
    DAY_END_HOUR,
    MINUTES_PER_CELL,
    PX_PER_HOUR_DESKTOP,
    PX_PER_HOUR_MOBILE,
} from "../day-view/day.constants";

import { clamp, snapToStepMinutes, toDate } from "../day-view/day.utils";
import { buildTimeLabels, getMaxConcurrencyInRange, layoutDayEvents } from "../day-view/day.layout";

import {calculateWeekAllDayPositions, getWeekDays, splitWeekEvents } from "../week-view/week.helpers";

type Props = {
    events: IEvent[];
    canEditCalendar: boolean;
};

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export function CalendarWeekView({ events , canEditCalendar }: Props) {
    const { selectedDate, use24HourFormat } = useCalendar();
    const isMobile = useMediaQuery("(max-width: 768px)");
    const pxPerHour = isMobile ? PX_PER_HOUR_MOBILE : PX_PER_HOUR_DESKTOP;

    const { isDragging, draggedEvent } = useDragDrop();

    const days = useMemo(() => getWeekDays(selectedDate, { weekStartsOn: 1 }), [selectedDate]);

    const timeLabels = useMemo(
        () => buildTimeLabels(selectedDate, DAY_START_HOUR, DAY_END_HOUR),
        [selectedDate]
    );

    const totalHeight = useMemo(() => {
        const hoursSlots = DAY_END_HOUR - DAY_START_HOUR;
        const bottomPad = 24;
        return hoursSlots * pxPerHour + bottomPad;
    }, [pxPerHour]);

    const { allDayEvents, timedEventsByDay } = useMemo(() => {
        return splitWeekEvents(events, days);
    }, [events, days]);

    const allDayPositions = useMemo(() => {
        return calculateWeekAllDayPositions(allDayEvents, days);
    }, [allDayEvents, days]);

    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(t);
    }, []);

    const showNowLine = days.some((d) => isSameDay(d, now));

    const pxPerMinute = useMemo(() => pxPerHour / 60, [pxPerHour]);

    const nowTop = useMemo(() => {
        if (!showNowLine) return null;

        const today = days.find((d) => isSameDay(d, now));
        if (!today) return null;

        const dayStart = startOfDay(today);
        const visibleStart = new Date(dayStart);
        visibleStart.setHours(DAY_START_HOUR, 0, 0, 0);

        const visibleEnd = new Date(dayStart);
        visibleEnd.setHours(DAY_END_HOUR, 0, 0, 0);

        const clamped = dfMin([dfMax([now, visibleStart]), visibleEnd]);
        const mins = differenceInMinutes(clamped, visibleStart);

        return { day: today, top: mins * pxPerMinute };
    }, [showNowLine, now, days, pxPerMinute]);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [draftRange, setDraftRange] = useState<{ start: Date; end: Date } | null>(null);

    const openCreateAt = React.useCallback((start: Date, end: Date) => {
        setDraftRange({ start, end });
        setIsAddOpen(true);
    }, []);

    return (
        <div className="w-full">
            <div className="relative bg-background">
                <div className="min-w-[1100px] md:min-w-0">
                    <div
                        className="grid"
                        style={{ gridTemplateColumns: isMobile ? "56px repeat(7, 1fr)" : "72px repeat(7, 1fr)" }}
                    >
                        <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b">
                            <div className={cn("h-14", isMobile ? "px-2" : "px-3")} />
                        </div>

                        {days.map((d, idx) => (
                            <div key={d.toISOString()} className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b">
                                <div className="h-14 flex items-center justify-center gap-2">
                                    <div className="text-xs text-muted-foreground">{WEEK_DAYS[idx]}</div>
                                    <div
                                        className={cn(
                                            "text-lg font-semibold w-8 h-8 flex items-center justify-center rounded-full mr-10",
                                            isToday(d) ? "bg-primary text-primary-foreground" : "text-foreground"
                                        )}
                                    >
                                        {format(d, "d", { locale: uk })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="border-b">
                            <div className={cn("h-16 flex items-center", isMobile ? "px-2" : "px-3")}>
                            </div>
                        </div>

                        {days.map((d) => (
                            <AllDayCell
                                key={`allday-${d.toISOString()}`}
                                day={d}
                                allDayEvents={allDayEvents}
                                positions={allDayPositions}
                            />
                        ))}

                        <div className="relative">
                            <div className="relative" style={{ height: totalHeight }}>
                                {timeLabels.map((t, idx) => {
                                    const label = format(t, use24HourFormat ? "HH:mm" : "h a", { locale: uk });
                                    return (
                                        <div key={idx} className="absolute left-0 w-full" style={{ top: idx * pxPerHour - 7 }}>
                                            <div className={cn("text-xs text-muted-foreground", isMobile ? "px-2" : "px-3")}>
                                                {label}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {days.map((day) => (
                            <WeekTimeColumn
                                key={`col-${day.toISOString()}`}
                                day={day}
                                events={timedEventsByDay.get(day.toDateString()) ?? []}
                                allWeekEvents={events}
                                pxPerHour={pxPerHour}
                                pxPerMinute={pxPerMinute}
                                totalHeight={totalHeight}
                                timeLabelsCount={timeLabels.length}
                                showNowLine={Boolean(nowTop && isSameDay(nowTop.day, day))}
                                nowTop={nowTop && isSameDay(nowTop.day, day) ? nowTop.top : null}
                                isDragging={isDragging}
                                draggedEvent={draggedEvent}
                                onCreateRange={openCreateAt}
                                canEditCalendar={canEditCalendar}
                            />
                        ))}
                    </div>

                    {canEditCalendar && draftRange ? (
                        <AddEditEventDialog
                            open={isAddOpen}
                            onOpenChange={(v) => {
                                setIsAddOpen(v);
                                if (!v) setDraftRange(null);
                            }}
                            initialStart={draftRange.start}
                            initialEnd={draftRange.end}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function AllDayCell({
                        day,
                        allDayEvents,
                        positions,
                    }: {
    day: Date;
    allDayEvents: IEvent[];
    positions: Record<string, number>;
}) {
    const dayStart = startOfDay(day);

    const list = useMemo(() => {
        return allDayEvents
            .filter((e) => {
                const s = startOfDay(toDate(e.startDate));
                const en = startOfDay(toDate(e.endDate));
                return dayStart >= s && dayStart <= en;
            })
            .map((e) => ({
                e,
                pos: positions[String(e.id)] ?? 0,
                kind: getAllDayPositionKind(e, dayStart),
            }))
            .sort((a, b) => a.pos - b.pos);
    }, [allDayEvents, dayStart, positions]);

    return (
        <div className="border-b border-l relative h-16 overflow-hidden">
            <div className="p-1 space-y-1">
                {list.slice(0, 2).map((item) => (
                    <div
                        key={String(item.e.id)}
                        className="h-5 text-[11px] px-2 flex items-center truncate border"
                        style={{
                            backgroundColor: `${item.e.color_hex}1A`,
                            borderColor: `${item.e.color_hex}66`,
                            color: item.e.color_hex,
                        }}
                        title={item.e.title}
                    >
                        {item.e.title ?? "Немає"}
                    </div>
                ))}
                {list.length > 2 ? (
                    <div className="text-[11px] text-muted-foreground px-1">+{list.length - 2}</div>
                ) : null}
            </div>
        </div>
    );
}

function getAllDayPositionKind(e: IEvent, cellDate: Date): "first" | "middle" | "last" | "none" {
    const s = startOfDay(toDate(e.startDate));
    const en = startOfDay(toDate(e.endDate));
    if (isSameDay(s, en)) return "none";
    if (isSameDay(cellDate, s)) return "first";
    if (isSameDay(cellDate, en)) return "last";
    return "middle";
}

function WeekTimeColumn({
                            day,
                            events,
                            pxPerHour,
                            pxPerMinute,
                            totalHeight,
                            canEditCalendar,
                            timeLabelsCount,
                            showNowLine,
                            nowTop,
                            isDragging,
                            draggedEvent,
                            onCreateRange,
                        }: {
    day: Date;
    events: IEvent[];
    allWeekEvents: IEvent[];
    pxPerHour: number;
    pxPerMinute: number;
    canEditCalendar: boolean;
    totalHeight: number;
    timeLabelsCount: number;
    showNowLine: boolean;
    nowTop: number | null;
    isDragging: boolean;
    draggedEvent: IEvent | null;
    onCreateRange: (start: Date, end: Date) => void;
}) {
    const { use24HourFormat } = useCalendar();

    const isMobile = useMediaQuery("(max-width: 768px)");

    const { positioned, visibleStart, visibleEnd } = useMemo(() => {
        return layoutDayEvents({
            events,
            day,
            dayStartHour: DAY_START_HOUR,
            dayEndHour: DAY_END_HOUR,
            pxPerHour,
        });
    }, [events, day, pxPerHour]);

    const [hoverMins, setHoverMins] = useState<number | null>(null);

    const calcMinsFromClientY = React.useCallback(
        (clientY: number, el: HTMLDivElement) => {
            const rect = el.getBoundingClientRect();
            const y = clientY - rect.top;

            const minsRaw = y / pxPerMinute;
            const minsClamped = clamp(minsRaw, 0, differenceInMinutes(visibleEnd, visibleStart));
            return snapToStepMinutes(minsClamped, MINUTES_PER_CELL);
        },
        [pxPerMinute, visibleStart, visibleEnd]
    );

    const handleEmptyClick = React.useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!canEditCalendar) return;
            const target = e.target as HTMLElement;
            if (target.closest('[data-event="1"]')) return;
            if (e.button !== 0) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;

            const minsRaw = y / pxPerMinute;
            const minsClamped = clamp(minsRaw, 0, differenceInMinutes(visibleEnd, visibleStart));
            const minsSnapped = snapToStepMinutes(minsClamped, MINUTES_PER_CELL);

            const startTime = new Date(visibleStart.getTime() + minsSnapped * 60_000);
            const endTime = new Date(startTime.getTime() + 60 * 60_000);

            onCreateRange(startTime, endTime);
        },
        [canEditCalendar , pxPerMinute, visibleStart, visibleEnd, onCreateRange]
    );

    const handleDragOverGrid = React.useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            if (!canEditCalendar) return;
            if (!isDragging) return;
            const el = e.currentTarget as HTMLDivElement;
            setHoverMins(calcMinsFromClientY(e.clientY, el));
        },
        [canEditCalendar, isDragging, calcMinsFromClientY]
    );

    const clearHover = React.useCallback(() => setHoverMins(null), []);

    const dropPreview = useMemo(() => {
        if (!isDragging || !draggedEvent || hoverMins == null) return null;

        const hoverStart = new Date(visibleStart.getTime() + hoverMins * 60_000);

        const s = toDate(draggedEvent.startDate);
        const en = toDate(draggedEvent.endDate);
        const durMins = Math.max(15, differenceInMinutes(en, s));
        const hoverEnd = new Date(hoverStart.getTime() + durMins * 60_000);

        const maxOverlap = getMaxConcurrencyInRange({
            events,
            rangeStart: hoverStart,
            rangeEnd: hoverEnd,
            visibleStart,
            excludeId: draggedEvent.id,
        });

        const colCount = clamp(maxOverlap + 1, 1, 6);
        const baseWidth = 100 / colCount;
        const width = Math.max(baseWidth, 2);

        return {
            top: hoverMins * pxPerMinute,
            height: Math.max(16, durMins * pxPerMinute),
            columns: Array.from({ length: colCount }).map((_, i) => ({
                left: baseWidth * i,
                width,
            })),
        };
    }, [isDragging, draggedEvent, hoverMins, visibleStart, pxPerMinute, events]);

    const getDropMeta = React.useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            const el = e.currentTarget as HTMLDivElement;
            const minsSnapped = calcMinsFromClientY(e.clientY, el);

            const totalMinutes = Math.max(0, Math.round(minsSnapped));
            const hour = DAY_START_HOUR + Math.floor(totalMinutes / 60);
            const minute = totalMinutes % 60;

            return { date: day, hour, minute };
        },
        [calcMinsFromClientY, day]
    );

    return (
        <div className="relative border-l">
            <DroppableArea date={day} className="relative" getDropMeta={getDropMeta}>
                <div
                    className="relative"
                    style={{ height: totalHeight }}
                    onClick={handleEmptyClick}
                    onDragOver={handleDragOverGrid}
                    onDragLeave={clearHover}
                    onDrop={() => clearHover()}
                >
                    {dropPreview ? (
                        <div className="pointer-events-none absolute inset-0 z-40">
                            {dropPreview.columns.map((c, i) => (
                                <div
                                    key={i}
                                    className="absolute border border-primary/40 bg-primary/10"
                                    style={{
                                        top: dropPreview.top,
                                        height: dropPreview.height,
                                        left: `${c.left}%`,
                                        width: `${c.width}%`,
                                    }}
                                />
                            ))}
                        </div>
                    ) : null}

                    {Array.from({ length: timeLabelsCount }).map((_, idx) => {
                        if (idx === 0) return null;
                        return (
                            <div
                                key={idx}
                                className="absolute left-0 right-0 border-t"
                                style={{ top: idx * pxPerHour }}
                            />
                        );
                    })}

                    {Array.from({
                        length: ((DAY_END_HOUR - DAY_START_HOUR) * 60) / MINUTES_PER_CELL + 1,
                    }).map((_, i) => {
                        const top = i * (MINUTES_PER_CELL * (pxPerHour / 60));
                        const isHour = i % (60 / MINUTES_PER_CELL) === 0;
                        if (isHour || top === 0) return null;
                        return (
                            <div
                                key={i}
                                className="absolute left-0 right-0 border-t border-muted/40"
                                style={{ top }}
                            />
                        );
                    })}

                    {showNowLine && nowTop != null ? (
                        <div className="absolute left-0 right-0 z-30" style={{ top: nowTop }}>
                            <div className="relative">
                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-2 w-2 bg-red-500" />
                                <div className="h-[2px] w-full bg-red-500" />
                            </div>
                        </div>
                    ) : null}


                    <div
                        className="relative overflow-hidden"
                        style={{ height: totalHeight }}
                        onClick={handleEmptyClick}
                        onDragOver={handleDragOverGrid}
                        onDragLeave={clearHover}
                        onDrop={() => clearHover()}
                    >
                        {positioned.map((p) => (
                            <div
                                key={String(p.event.id)}
                                className="absolute z-20"
                                style={{
                                    top: p.top,
                                    height: p.height,

                                    left: `calc(${p.left}% + 2px)`,
                                    width: `calc(${p.width}% - 6px)`,
                                }}
                            >
                                <DraggableEvent event={p.event}>
                                    <EventDetailsDialog event={p.event} canEditCalendar={canEditCalendar}>
                                        <motion.div
                                            role="button"
                                            tabIndex={0}
                                            data-event="1"
                                            className={cn(
                                                "h-full w-full cursor-pointer select-none border shadow-sm hover:shadow transition overflow-hidden",
                                                "box-border",
                                                isMobile ? "px-10 py-0.5" : "p-1.5"
                                            )}
                                            style={{
                                                backgroundColor: `${p.event.color_hex}1A`,
                                                borderColor: `${p.event.color_hex}66`,
                                                color: p.event.color_hex,
                                            }}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: isMobile ? 0.12 : 0.2 }}
                                        >
                                            {isMobile ? (
                                                <div className="text-[11px] font-semibold leading-4 truncate">
                                                    {p.event.title ?? "Немає"}
                                                </div>
                                            ) : (
                                                <>
                                                        <div className="text-xs font-semibold leading-4">
                                                            {p.event.title ?? "Немає"}
                                                        </div>
                                                        <div className="text-[10px] opacity-80">
                                                            {format(toDate(p.event.startDate), use24HourFormat ? "HH:mm" : "h:mm a", { locale: uk })}
                                                            {" – "}
                                                            {format(toDate(p.event.endDate), use24HourFormat ? "HH:mm" : "h:mm a", { locale: uk })}
                                                        </div>
                                                </>
                                            )}
                                        </motion.div>
                                    </EventDetailsDialog>
                                </DraggableEvent>
                            </div>
                        ))}
                    </div>
                </div>
            </DroppableArea>
        </div>
    );
}
