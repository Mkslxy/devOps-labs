import {StaffMeetingTypeEnum} from "@/store/staff-meeting/staff-meeting.type";
import {UserFormData} from "@/store/users/user.type";
import {Lesson} from "@/store/lessons/lesson.type";

export interface IEvent {
  id: number;
  startDate: string;
  endDate: string;
  title: string;
  color?: number;
  description?: string;
  lessonType: number;
  teacher?: {
    id?: number;
    full_name?: string;
  };
  is_online?: boolean;
  meet_link?: string | null;
  html_link?: string | null;
  groupId: number;
  status: string;
  teacher_id: number;
  color_hex: string;
  lesson_plan?: string;

  rawStaffMeeting?: IStaffMeetingEvent | null;
  rawTraining?: ITrainingEvent | null;
  rawLesson?: Lesson | null;

  send_for_review?: boolean;
}

export interface IStaffMeetingEvent {
  id: number;
  start_time: string;
  end_time: string;

  title: string;
  description?: string;

  type: StaffMeetingTypeEnum;

  attendees: UserFormData[];
  attendee_ids?: number[];

  color_id: string;
  color_hex: string;

  is_online?: boolean;
  meet_link: string;
  html_link: string;

  created_by: UserFormData;

  created_at: string;
  updated_at: string;
}

export interface ITrainingEvent {
  id: number;
  title: string;
  description?: string | null;
  type: "training";

  attendees: UserFormData[];
  attendee_ids?: number[];

  start_time: string;
  end_time: string;

  color_id: string;
  color_hex?: string | null;

  meet_link?: string | null;
  html_link?: string | null;

  is_online?: boolean;

  created_by?: UserFormData | null;
  created_at?: string;
  updated_at?: string;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
