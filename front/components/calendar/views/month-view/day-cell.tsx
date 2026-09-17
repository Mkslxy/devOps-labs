"use client";

import { isToday, startOfDay, isSunday, isSameMonth, isBefore } from "date-fns";
import { motion } from "framer-motion";
import React, { useMemo, useState } from "react";

import { cn } from "@/libs/utils";

import { AddEditEventDialog } from "../../dialogs/add-edit-event-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ICalendarCell, IEvent } from "../../interfaces";
import { useMediaQuery } from "../../hooks";
import { getMonthCellEvents } from "../../helpers";
import { transition } from "../../animations";
import { EventBullet } from "./event-bullet";
import { MonthEventBadge } from "./month-event-badge";
import { DroppableArea } from "../../dnd/droppable-area";
import { EventListPopover } from "./event-list-popover";

interface IProps {
    cell: ICalendarCell;
    events: IEvent[];
    eventPositions: Record<string, number>;
    canEditCalendar: boolean;
}

const MAX_DESKTOP_VISIBLE_EVENTS = 3;
const MAX_MOBILE_VISIBLE_EVENTS = 5;

export function DayCell({ cell, events, eventPositions, canEditCalendar }: IProps) {
    const { day, currentMonth, date } = cell;
    const isMobile = useMediaQuery("(max-width: 768px)");

    const { cellEvents, currentCellMonth } = useMemo(() => {
        const cellEvents = getMonthCellEvents(date, events, eventPositions);
        const currentCellMonth = startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
        return { cellEvents, currentCellMonth };
    }, [date, events, eventPositions]);

    const isPastDay = isBefore(startOfDay(date), startOfDay(new Date()));
    const maxVisible = isMobile ? MAX_MOBILE_VISIBLE_EVENTS : MAX_DESKTOP_VISIBLE_EVENTS;

    const visibleEvents = useMemo(() => {
        return [...cellEvents]
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .slice(0, maxVisible);
    }, [cellEvents, maxVisible]);

    const showMoreCount = Math.max(0, cellEvents.length - maxVisible);
    const showMore = currentMonth && showMoreCount > 0;

    const [isAddOpen, setIsAddOpen] = useState(false);

    const canOpenAdd = canEditCalendar && !isPastDay && !isAddOpen;

    const openAdd = (e: React.SyntheticEvent) => {
        if (!canOpenAdd) return;

        const target = e.target as HTMLElement | null;
        const isInteractive = target?.closest?.(
            'button, a, [role="button"], [data-stop-add], [data-event-click]'
        );
        if (isInteractive) return;

        setIsAddOpen(true);
    };

    const content = (
        <>
            <motion.span
                className={cn(
                    "h-6 px-1 text-xs font-semibold md:px-2",
                    !currentMonth && "opacity-20",
                    isPastDay && "text-muted-foreground opacity-60",
                    isToday(date) &&
                    "flex w-6 translate-x-1 items-center justify-center rounded-full bg-primary px-0 font-bold text-primary-foreground"
                )}
            >
                {day}
            </motion.span>

            <motion.div
                className={cn(
                    "relative flex flex-col flex-1 min-h-0 overflow-hidden",
                    "gap-0.5 px-0",
                    "md:h-[98px] md:gap-2 md:px-0",
                    !currentMonth && "opacity-50"
                )}
            >
                <div
                    className={cn(
                        "relative z-10 flex flex-col flex-1 min-h-[120px] md:min-h-0 overflow-hidden gap-0.5 md:gap-2 touch-manipulation p-1",
                        canOpenAdd ? "cursor-pointer" : "cursor-default"
                    )}
                    onClick={openAdd}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        openAdd(e);
                    }}
                >
                    {cellEvents.length === 0 ? (
                        <div className="flex justify-center items-center group">
                            {canEditCalendar && !isPastDay ? (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!canOpenAdd) return;
                                        setIsAddOpen(true);
                                    }}
                                    data-stop-add
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            ) : null}
                        </div>
                    ) : (
                        visibleEvents.map((event, idx) => {
                            const showBullet = isSameMonth(new Date(event.startDate), currentCellMonth);

                            return (
                                <motion.div
                                    key={`event-${event.id}-${event.position ?? idx}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05, ...transition }}
                                    className="relative z-10"
                                    data-event-click
                                    onClick={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onTouchEnd={(e) => e.stopPropagation()}
                                >
                                    {showBullet ? (
                                        <EventBullet className="md:hidden cursor-pointer" color={event.color_hex} />
                                    ) : null}

                                    <MonthEventBadge
                                        className={cn(
                                            "mx-0.5 h-4 rounded-sm px-1 text-[10px] leading-4",
                                            "md:mx-1 md:h-6.5 md:rounded-md md:px-2 md:text-xs md:leading-normal"
                                        )}
                                        event={event}
                                        cellDate={startOfDay(date)}
                                        canEditCalendar={canEditCalendar}
                                    />
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {canEditCalendar && !isPastDay ? (
                    <AddEditEventDialog startDate={date} open={isAddOpen} onOpenChange={setIsAddOpen} />
                ) : null}
            </motion.div>

            {showMore ? (
                <motion.div
                    className={cn(
                        "relative z-20 px-2 my-2 text-end text-xs font-semibold text-muted-foreground",
                        !currentMonth && "opacity-50"
                    )}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, ...transition }}
                    onClick={(e) => e.stopPropagation()}
                    data-stop-add
                >
                    <EventListPopover date={date} events={cellEvents} canEditCalendar={canEditCalendar}>
                        <button
                            type="button"
                            className="hover:text-foreground cursor-pointer transition underline underline-offset-2"
                            onPointerDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            data-stop-add
                        >
                            +{showMoreCount}
                        </button>
                    </EventListPopover>
                </motion.div>
            ) : null}
        </>
    );

    return (
        <motion.div
            className={cn(
                "flex h-full min-h-0 flex-col border-l border-t overflow-hidden",
                isSunday(date) && "border-l-0"
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
        >
            {canEditCalendar ? (
                <DroppableArea date={date} className="w-full h-full">
                    {content}
                </DroppableArea>
            ) : (
                <div className="w-full h-full">{content}</div>
            )}
        </motion.div>
    );
}
