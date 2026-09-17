import {UserFormData} from "@/store/users/user.type";

export enum SalaryAdjustmentTypeEnum {
    penalty = "penalty",
    bonus = "bonus",
}

export interface SalaryAdjustment {
    id: number;
    user: UserFormData;
    name: string;
    description?: string;
    type: SalaryAdjustmentTypeEnum;
    amount: string;
    payout: string;
    created_at: string;
    updated_at: string;
}

export interface SalaryAdjustmentPayload {
    user_id: number;
    name: string;
    description?: string;
    type: SalaryAdjustmentTypeEnum;
    amount: string;
}