import { UserFormData } from "@/store/users/user.type";

export enum SalaryPayoutStatusEnum {
    pending = "pending",
    paid = "paid",
    cancelled = "cancelled",
}

export const SALARY_PAYOUT_STATUS_LABELS: Record<SalaryPayoutStatusEnum, string> = {
    [SalaryPayoutStatusEnum.pending]: "Очікує виплати",
    [SalaryPayoutStatusEnum.paid]: "Виплачено",
    [SalaryPayoutStatusEnum.cancelled]: "Скасовано",
};

export interface SalaryPayout {
    id: number;
    user: UserFormData;

    period_start: string;
    period_end: string;

    base_rate_calculated: string | number;
    lessons_amount_calculated: string | number;
    retention_amount: string | number;
    bonuses_total: string | number;
    penalties_total: string | number;
    total_payout: string | number;

    status?: SalaryPayoutStatusEnum;
    paid_at?: string | null;

    created_at: string;
    updated_at?: string;
}

export interface SalaryPayoutPayload {
    user_id: number;
    period_start: string;
    period_end: string;
}

export interface SalaryPayoutMark {
    payment_method_id: number;
}

export interface SalaryPayoutMarkResponse {
    message: string;
}

export interface SalaryPayoutCancelResponse {
    status: string;
    detail: string;
}

export interface TeacherStats {
    lessons_count: number;
    total_minutes: number;

    base_rate: string | number;
    lessons_amount: string | number;
    bonuses_total: string | number;
    penalties_total: string | number;

    gross_salary: string | number;
    retention_amount: string | number;
    clear_salary: string | number;
    accumulated_reserve: string | number;
}