import {UserFormData} from "@/store/users/user.type";
import {Currency} from "@/store/pnl/pnl.type";

export interface SalaryTariff {
    id: number;
    user: UserFormData;
    currency: Currency;
    base_rate?: string;
    amount_per_lesson?: string;
    retention_percent?: string;
    accumulated_reserve: string;
}

export interface SalaryTariffPayload {
    user_id: number;
    currency_id: number;
    base_rate?: string;
    amount_per_lesson?: string;
    retention_percent?: string;
}