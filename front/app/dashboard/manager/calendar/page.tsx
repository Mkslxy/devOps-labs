import CalendarGate from "@/components/calendar/calendar-gate";
import { CalendarSkeleton } from "@/components/calendar/skeletons/calendar-skeleton";
import { Suspense } from "react";

export default function CalendarPageManager() {
    return (
        <Suspense fallback={<CalendarSkeleton />}>
            <CalendarGate />
        </Suspense>
    );
}
