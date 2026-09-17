import {StaffMeetingTypeEnum} from "@/store/staff-meeting/staff-meeting.type";

export const STAFF_MEETING_TYPE_LABELS: Record<StaffMeetingTypeEnum, string> = {
    [StaffMeetingTypeEnum.training]: "Трейнінг",
    [StaffMeetingTypeEnum.staff_meeting]: "Загальна зустріч",
};
