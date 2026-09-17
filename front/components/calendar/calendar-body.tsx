"use client";

import {
    isSameDay,
    parseISO,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    isValid,
} from "date-fns";
import { motion } from "framer-motion";
import React, { useEffect, useMemo } from "react";

import { useCalendar } from "./contexts/calendar-context";
import { CalendarMonthView } from "./views/month-view/calendar-month-view";
import { CalendarDayView } from "./views/day-view/calendar-day-view";
import { CalendarWeekView } from "@/components/calendar/views/week-view/calendar-week-view";

import { fadeIn, transition } from "./animations";
import { useGetProfileMeQuery } from "@/store/users/user.api";

import { useGetAllLessonsQuery } from "@/store/lessons/lesson.api";
import { lessonToEvent } from "@/components/calendar/adapters/lessonToEvent";

import { useGetStaffMeetingsQuery } from "@/store/staff-meeting/staff-meeting.api";
import { staffMeetingToEvent } from "@/components/calendar/adapters/staffMeetingToEvent";

import { useGetTrainingsQuery } from "@/store/training/training.api";
import { trainingToEvent } from "@/components/calendar/adapters/trainingToEvent";

import type { IEvent } from "./interfaces";

function isEventDatesValid(e: IEvent): boolean {
    if (!e?.startDate || !e?.endDate) return false;
    const s = parseISO(e.startDate);
    const en = parseISO(e.endDate);
    return isValid(s) && isValid(en);
}

export function CalendarBody({ canEditCalendar }: { canEditCalendar: boolean }) {
    const { view, setEvents, selectedDate } = useCalendar();

    const { data: me } = useGetProfileMeQuery();
    const roleSlug = me?.role?.slug ?? null;

    const isRoleReady = Boolean(roleSlug);
    const isStudent = roleSlug === "student";

    const isTeacher = roleSlug === "teacher";
    const isMethodist = roleSlug === "methodist";

    const { rangeStart, rangeEnd } = useMemo(() => {
        if (view === "day") {
            const s = startOfDay(selectedDate);
            const e = endOfDay(selectedDate);
            return { rangeStart: s, rangeEnd: e };
        }

        if (view === "week") {
            const s = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const e = endOfWeek(selectedDate, { weekStartsOn: 1 });
            return { rangeStart: startOfDay(s), rangeEnd: endOfDay(e) };
        }

        const s = startOfMonth(selectedDate);
        const e = endOfMonth(selectedDate);
        return { rangeStart: startOfDay(s), rangeEnd: endOfDay(e) };
    }, [selectedDate, view]);

    const queryParams = useMemo(() => {
        return {
            start: rangeStart.toISOString(),
            end: rangeEnd.toISOString(),
            page_size: 50,
            page: 1,
            ...(isTeacher && me?.id ? { teacher: me.id } : {}),
        };
    }, [rangeStart, rangeEnd, isTeacher, me?.id]);

    const { data: allLessons } = useGetAllLessonsQuery(queryParams, {
        skip: !isRoleReady || (isTeacher && !me?.id),
    });

    const { data: allStaffMeetings } = useGetStaffMeetingsQuery(queryParams, {
        skip: !isRoleReady || isStudent,
    });

    const { data: allTrainings } = useGetTrainingsQuery(queryParams, {
        skip: !isRoleReady || isStudent,
    });

    const events = useMemo<IEvent[]>(() => {
        const lessons = allLessons?.results ?? [];
        const meetings = allStaffMeetings?.results ?? [];
        const trainings = allTrainings?.results ?? [];

        const merged = [
            ...lessons.map(lessonToEvent),
            ...meetings.map(staffMeetingToEvent),
            ...trainings.map(trainingToEvent),
        ];

        return merged.filter(isEventDatesValid).map((e) => ({
            ...e,
            color_hex: e.color_hex ?? "#3b82f6",
        }));
    }, [allLessons?.results, allStaffMeetings?.results, allTrainings?.results]);

    useEffect(() => {
        setEvents(events);
    }, [events, setEvents]);

    const singleDayEvents = useMemo(() => {
        return events.filter((event) => {
            const startDate = parseISO(event.startDate);
            const endDate = parseISO(event.endDate);
            return isSameDay(startDate, endDate);
        });
    }, [events]);

    const multiDayEvents = useMemo(() => {
        return events.filter((event) => {
            const startDate = parseISO(event.startDate);
            const endDate = parseISO(event.endDate);
            return !isSameDay(startDate, endDate);
        });
    }, [events]);

    return (
        <div className="w-full h-full overflow-auto relative">
            <motion.div
                key={view}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={fadeIn}
                transition={transition}
            >
                {view === "month" && (
                    <CalendarMonthView
                        singleDayEvents={singleDayEvents}
                        multiDayEvents={multiDayEvents}
                        canEditCalendar={canEditCalendar}
                    />
                )}

                {view === "day" && <CalendarDayView events={events} canEditCalendar={canEditCalendar} />}

                {view === "week" && <CalendarWeekView events={events} canEditCalendar={canEditCalendar} />}
            </motion.div>
        </div>
    );
}