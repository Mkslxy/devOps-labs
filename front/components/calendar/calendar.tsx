"use client";

import { CalendarProvider } from "./contexts/calendar-context";
import { DndProvider } from "./contexts/dnd-context";
import { CalendarHeader } from "./header/calendar-header";
import { CalendarBody } from "./calendar-body";
import { useGetProfileMeQuery } from "@/store/users/user.api";

export function Calendar() {
    const { data: me } = useGetProfileMeQuery();
    const canEditCalendar = me?.role?.slug !== "student";

    return (
        <CalendarProvider view="month">
            <DndProvider showConfirmation={false} readOnly={!canEditCalendar}>
                <div className="w-full border rounded-xl">
                    <CalendarHeader />
                    <CalendarBody canEditCalendar={canEditCalendar} />
                </div>
            </DndProvider>
        </CalendarProvider>
    );
}
