import { Currency } from "@/store/pnl/pnl.type";
import { Course } from "@/store/groups/group.type";

export interface SubscriptionPlan {
    id: number;
    name: string;
    description?: string | null;
    lessons_count: number;
    duration_days: number;
    grace_period_days: number;
    price: string;
    price_per_lesson?: string | null;
    currency: Currency | null;
    currency_value?: number | null;
    course: Course | null;
    course_value?: number | null;
    lesson_type?: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface SubscriptionPlanPayload {
    name: string;
    description?: string;
    lessons_count: number;
    duration_days: number;
    grace_period_days?: number;
    price: string;
    price_per_lesson?: string;
    currency_id: number;
    course_id?: number;
    lesson_type?: number;
    is_active?: boolean;
}
