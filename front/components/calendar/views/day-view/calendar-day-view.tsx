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
} from "date-fns";
import { uk } from "date-fns/locale";

import { cn } from "@/libs/utils";
import { useMediaQuery } from "../../hooks";
import { DroppableArea } from "../../dnd/droppable-area";
import { DraggableEvent } from "../../dnd/draggable-event";
import { EventDetailsDialog } from "../../dialogs/event-details-dialog";
import { AddEditEventDialog } from "@/components/calendar/dialogs/add-edit-event-dialog";
import { useDragDrop } from "@/components/calendar/contexts/dnd-context";
import {
    DAY_START_HOUR,
    DAY_END_HOUR,
    MINUTES_PER_CELL,
    PX_PER_HOUR_DESKTOP,
    PX_PER_HOUR_MOBILE,
} from "./day.constants";

import { clamp, snapToStepMinutes, toDate } from "./day.utils";
import { buildTimeLabels, getMaxConcurrencyInRange, layoutDayEvents } from "./day.layout";
import { IEvent } from "../../interfaces";
import { useCalendar } from "../../contexts/calendar-context";

type Props = {
    events: IEvent[];
    canEditCalendar: boolean;
};

export function CalendarDayView({ events , canEditCalendar  }: Props) {
    const { selectedDate, use24HourFormat } = useCalendar();
    const isMobile = useMediaQuery("(max-width: 768px)");
    const pxPerHour = isMobile ? PX_PER_HOUR_MOBILE : PX_PER_HOUR_DESKTOP;

    const { isDragging, draggedEvent } = useDragDrop();

    const timeLabels = useMemo(
        () => buildTimeLabels(selectedDate, DAY_START_HOUR, DAY_END_HOUR),
        [selectedDate]
    );

    const totalHeight = useMemo(() => {
        const hoursSlots = DAY_END_HOUR - DAY_START_HOUR;
        const bottomPad = 24;
        return hoursSlots * pxPerHour + bottomPad;
    }, [pxPerHour]);

    const { positioned, visibleStart, visibleEnd, pxPerMinute } = useMemo(
        () =>
            layoutDayEvents({
                events,
                day: selectedDate,
                dayStartHour: DAY_START_HOUR,
                dayEndHour: DAY_END_HOUR,
                pxPerHour,
            }),
        [events, selectedDate, pxPerHour]
    );

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [draftRange, setDraftRange] = useState<{ start: Date; end: Date } | null>(null);

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

            setDraftRange({ start: startTime, end: endTime });
            setIsAddOpen(true);
        },
        [canEditCalendar , pxPerMinute, visibleStart, visibleEnd]
    );

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

    const handleDragOverGrid = React.useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            if (!canEditCalendar) return;
            if (!isDragging) return;
            const el = e.currentTarget as HTMLDivElement;
            setHoverMins(calcMinsFromClientY(e.clientY, el));
        },
        [ canEditCalendar , isDragging, calcMinsFromClientY ]
    );

    const clearHover = React.useCallback(() => setHoverMins(null), []);

    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(t);
    }, []);

    const showNowLine = isToday(selectedDate);
    const nowTop = useMemo(() => {
        if (!showNowLine) return null;
        const clamped = dfMin([dfMax([now, visibleStart]), visibleEnd]);
        const mins = differenceInMinutes(clamped, visibleStart);
        return mins * pxPerMinute;
    }, [showNowLine, now, visibleStart, visibleEnd, pxPerMinute]);

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
            label: `${format(hoverStart, "HH:mm", { locale: uk })} – ${format(hoverEnd, "HH:mm", { locale: uk })}`,
        };
    }, [isDragging, draggedEvent, hoverMins, visibleStart, pxPerMinute, events]);

    const getDropMeta = React.useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            const el = e.currentTarget as HTMLDivElement;
            const minsSnapped = calcMinsFromClientY(e.clientY, el);

            const totalMinutes = Math.max(0, Math.round(minsSnapped));
            const hour = DAY_START_HOUR + Math.floor(totalMinutes / 60);
            const minute = totalMinutes % 60;

            return { date: selectedDate, hour, minute };
        },
        [calcMinsFromClientY, selectedDate]
    );

    return (
        <div className="w-full">
            <div className="relative bg-background">
                <div className="min-w-[900px] md:min-w-0">
                    <div
                        className="relative grid"
                        style={{ gridTemplateColumns: isMobile ? "56px 1fr" : "72px 1fr" }}
                    >
                        <div className="relative">
                            <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b">
                                <div className={cn("h-10", isMobile ? "px-2" : "px-3")} />
                            </div>

                            <div className="relative" style={{ height: totalHeight }}>
                                {timeLabels.map((t, idx) => {
                                    const label = format(t, use24HourFormat ? "HH:mm" : "h a", { locale: uk });
                                    return (
                                        <div
                                            key={idx}
                                            className="absolute left-0 w-full"
                                            style={{ top: idx * pxPerHour - 8 }}
                                        >
                                            <div className={cn("text-xs text-muted-foreground", isMobile ? "px-2" : "px-3")}>
                                                {label}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b">
                                <div className="h-10 flex items-center px-3 text-sm text-muted-foreground">
                                    {isSameDay(selectedDate, new Date()) ? "Сьогодні" : "Розклад"}
                                </div>
                            </div>

                            <DroppableArea date={selectedDate} className="relative" getDropMeta={getDropMeta}>
                                <div
                                    className="relative"
                                    style={{ height: totalHeight }}
                                    onClick={handleEmptyClick}
                                    onDragOver={handleDragOverGrid}
                                    onDragLeave={clearHover}
                                    onDrop={() => clearHover()}
                                >
                                    {dropPreview && (
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
                                    )}

                                    {timeLabels.map((_, idx) => {
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

                                    {showNowLine && nowTop !== null && (
                                        <div className="absolute left-0 right-0 z-30" style={{ top: nowTop }}>
                                            <div className="relative">
                                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-2 w-2  bg-red-500" />
                                                <div className="h-[2px] w-full bg-red-500" />
                                            </div>
                                        </div>
                                    )}

                                    {positioned.map((p) => (
                                        <div
                                            key={String(p.event.id)}
                                            className="absolute z-20 px-1"
                                            style={{
                                                top: p.top,
                                                height: p.height,
                                                left: `${p.left}%`,
                                                width: `${p.width}%`,
                                            }}
                                        >
                                            <DraggableEvent event={p.event}>
                                                <EventDetailsDialog event={p.event} canEditCalendar={canEditCalendar}>
                                                    <motion.div
                                                        role="button"
                                                        tabIndex={0}
                                                        data-event="1"
                                                        className={cn(
                                                            "h-full w-full cursor-pointer select-none border shadow-sm hover:shadow transition",
                                                            "overflow-hidden",
                                                            isMobile
                                                                ? "px-1.5 py-0.5"
                                                                : "p-1.5"
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
                                                                {p.event.title}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="text-xs ml-2 font-semibold leading-4 line-clamp-2">
                                                                    {p.event.title}
                                                                </div>
                                                                <div className="mt-1 ml-2 pl-5 text-[11px] opacity-80">
                                                                    {format(toDate(p.event.startDate), use24HourFormat ? "HH:mm" : "h:mm a", {
                                                                        locale: uk,
                                                                    })}
                                                                    {" – "}
                                                                    {format(toDate(p.event.endDate), use24HourFormat ? "HH:mm" : "h:mm a", {
                                                                        locale: uk,
                                                                    })}
                                                                </div>
                                                            </>
                                                        )}
                                                    </motion.div>
                                                </EventDetailsDialog>
                                            </DraggableEvent>
                                        </div>
                                    ))}
                                </div>
                            </DroppableArea>
                        </div>
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
