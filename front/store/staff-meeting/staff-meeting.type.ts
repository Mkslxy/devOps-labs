import {UserFormData} from "@/store/users/user.type";

export enum StaffMeetingTypeEnum {
    training = 'training',
    staff_meeting = "staff_meeting",
}

export interface StaffMeeting {
    id: number;
    title: string;
    description?: string;
    type: StaffMeetingTypeEnum;
    attendees: UserFormData[];
    start_time: string;
    end_time: string;
    color_id: string;
    color_hex: string;
    meet_link: string;
    html_link: string;
    is_online?: boolean;
    created_by: UserFormData;
    created_at: string;
    updated_at: string;
}

export interface StaffMeetingResponse {
    count: number;
    next: string;
    previous: string;
    results: StaffMeeting[];
}

export interface StaffMeetingPayload {
    title: string;
    description?: string;
    attendee_ids: number[];
    type: StaffMeetingTypeEnum;
    start_time: string;
    end_time: string;
    color_id?: string;
    is_online?: boolean;
}
