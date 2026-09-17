import {UserFormData} from "@/store/users/user.type";
import { SubscriptionPlan } from "./subscription-plan.type";
import {Group} from "@/store/groups/group.type";

export enum StudentSubscriptionStatusEnum {
    pending_assignment = "pending_assignment",
    active = "active",
    frozen = "frozen",
    completed = "completed",
    cancelled = "cancelled",
}

export interface StudentSubscription {
    id: number;
    student: UserFormData;
    lessons_remaining?: number;
    plan: SubscriptionPlan;
    group: Group;
    status?: StudentSubscriptionStatusEnum;
    start_date?: string;
    end_date?: string;
    created_at: string;
    updated_at: string;
}

export interface StudentSubscriptionPayload {
    student_id: number | undefined;
    lessons_remaining?: number;
    plan_id: number;
    group_id: number;
    status?: StudentSubscriptionStatusEnum;
    start_date?: string;
    end_date?: string;
}