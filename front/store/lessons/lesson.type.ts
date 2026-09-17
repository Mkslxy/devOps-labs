import type { UserFormData } from "@/store/users/user.type";

export interface LessonRequest {
  topic: string;
  description?: string;
  start_time: string;
  lesson_type_id: number;
  group_id: number;
  teacher_id: number;
  color_id: string;
  status: string;
  lesson_plan?: string;
  is_online?: boolean;
}

export type LessonPatchRequest = Partial<LessonRequest>;

export type LessonType = {
  id: number;
  name: string;
  slug: string;
  duration_minutes: number;
};

export type LessonTypePayload = {
  name: string;
  slug: string;
  duration_minutes: number;
  category?: LessonCategoryEnum;

};

export interface LessonTypeResponse {
  count: number;
  next: string;
  previous: string;
  results: LessonType[];
}

export type WeeklySchedule = {
  day_of_week: number;
  time: string;
  lesson_type_id?: number;
  is_online?: boolean;
};

export interface CreateRecurringLessonPayload {
  group_id: number;
  teacher_id: number;
  lesson_type_id: number;

  topic: string;
  description?: string;

  category?: LessonCategoryEnum;

  color_id?: string;
  is_online?: boolean;

  start_date: string;
  end_date: string;

  schedule: WeeklySchedule[];
}

export type CancelLessonByTeacherPayload = {
  id: number;
  reason: string;
};

export type CancelLessonByTeacherResponse = {
  status: string;
};

export enum LessonCategoryEnum {
  standard = 'standard',
  training = 'training',
  staff_meeting = "staff_meeting",
}

export enum LessonPlanStatusEnum {
  empty = "empty",
  draft = "draft",
  on_review = "on_review",
  changes_requested = "changes_requested",
  approved = "approved",
}

export interface Lesson {
  id: number;
  topic: string;
  description: string;
  category: LessonCategoryEnum;
  start_time: string;
  end_time: string;
  lesson_type: {
    id: number;
    name: string;
    slug: string;
    duration_minutes: number;
  };
  group: {
    id: number;
    name: string;
    status: string;
    age_group: string;
    knowledge_level: string;
    teacher: number;
    students: Array<{
      id: number;
      email: string;
      full_name: string;
      phone_country_code: string;
      phone_national_number: string;
      phone_normalized: string;
      date_of_birth: string;
    }>;
    is_online: boolean;
  };
  teacher: {
    id: number;
    email: string;
    full_name: string;
    phone_country_code: string;
    phone_national_number: string;
    phone_normalized: string;
    date_of_birth: string;
  };
  color_id: string;
  color_hex: string;
  meet_link: string;
  html_link: string;
  status: string;
  lesson_plan: string;
  is_online?: boolean;
  plan_status: LessonPlanStatusEnum;
  plan_feedback?: string | null;
}

export type AvailableTeacher = Pick<UserFormData, "id" | "email" | "full_name">;

export interface LessonResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Lesson[];
}

export enum LessonPlanReviewAction {
  approve = "approve",
  reject = "reject",
}

export interface LessonPlanReviewPayload {
  action: LessonPlanReviewAction;
  feedback?: string;
}

export interface LessonPlanPayload {
  lesson_plan: string;
  send_for_review: boolean;
}
