import type { IEvent, ITrainingEvent } from "@/components/calendar/interfaces";

function safeStr(v: unknown): string {
    return typeof v === "string" ? v : "";
}

export function trainingToEvent(t: ITrainingEvent): IEvent {
    const start = safeStr(t.start_time);
    const end = safeStr(t.end_time);

    return {
        id: t.id,
        title: t.title ?? "",
        description: t.description ?? "",

        startDate: start,
        endDate: end,

        lessonType: 0,
        groupId: 0,
        status: "planned",
        teacher_id: t.created_by?.id ?? 0,

        color_hex: t.color_hex ?? "",
        meet_link: t.meet_link ?? null,
        html_link: t.html_link ?? null,
        is_online: Boolean(t.is_online),

        rawTraining: t,
        rawStaffMeeting: null,
    };
}
