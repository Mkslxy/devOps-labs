import {UserFormData} from "@/store/users/user.type";
import {School} from "@/store/school/school.type";
import {Subscription} from "react-redux";

export enum AgeGroupEnum {
    kids = "kids",
    teens = "teens",
    adults = "adults",
}

export enum StatusEnum {
    recruiting = "recruiting",
    active = "active",
    finished = "finished",
    archived = "archived",
}

export enum KnowledgeLevelEnum {
    beginner = "beginner",
    elementary = "elementary",
    pre_intermediate = "pre_intermediate",
    intermediate = "intermediate",
    upper_intermediate = "upper_intermediate",
    advanced = "advanced",
}

export interface Group {
    id: number;
    name: string;
    status?: StatusEnum;
    age_group: AgeGroupEnum;
    knowledge_level: KnowledgeLevelEnum;
    teacher?: UserFormData;
    teacher_id?: number;
    course_id: number | null;
    course?: Course | null;
    school?: School | null;
    school_id?: number;
    students: UserFormData[];
    is_online: boolean;
}

export interface GroupPayload {
    name: string;
    status: StatusEnum;
    age_group: AgeGroupEnum;
    knowledge_level: KnowledgeLevelEnum;
    teacher_id: number;
    school_id: number;
    course_id: number | null;
    student_ids: number[];
    is_online: boolean;
}

export interface GroupListParams {
    page?: number;
    page_size?: number;
    ordering?: string;
    search?: string;

    teacher?: number;
    course?: number;
    status?: StatusEnum;
    age_group?: AgeGroupEnum;
    knowledge_level?: KnowledgeLevelEnum;
}


export interface GroupResponse{
    count: number;
    next: string;
    previous: string;
    results: Group[];
}

export interface SubscriptionPlanMini {
    id: number;
    name: string;
    lessons_count: number;
    duration_days: number;
    price: number;
    is_active?: boolean;
}

export interface Course {
    id: number;
    title: string;
    description: string;
    price: string;
    level: string;
    is_active: boolean;
    created_by: number;
    subscription_plans: SubscriptionPlanMini;
}

export interface CoursePayload {
    title: string;
    description: string;
    subject_id: number;
    price: string;
    level: string;
    is_active: boolean;
}

export interface CourseResponse{
    count: number;
    next: string;
    previous: string;
    results: Course[];
}