import type { StaffMeeting } from "@/store/staff-meeting/staff-meeting.type";
import type { IEvent } from "../interfaces";

export function staffMeetingToEvent(m: StaffMeeting): IEvent {
    return {
        id: m.id,
        startDate: m.start_time,
        endDate: m.end_time ?? m.start_time,

        title: m.title ?? "",
        description: m.description ?? "",

        lessonType: 0,
        groupId: 0,
        status: "planned",
        teacher_id: m.created_by?.id ?? 0,

        color: m.color_id ? Number(m.color_id) : 1,
        color_hex: m.color_hex ?? "#3b82f6",

        teacher: {
            id: m.created_by?.id,
            full_name: m.created_by?.full_name,
        },

        is_online: Boolean(m.is_online),
        meet_link: m.meet_link ?? null,

        rawStaffMeeting: m,
    };
}
