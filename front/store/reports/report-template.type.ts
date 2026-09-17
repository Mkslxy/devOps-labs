import {UserFormData} from "@/store/users/user.type";

export enum FrequencyEnum {
    daily = "daily",
    weekly = "weekly",
    monthly = "monthly",
}

export enum BlankEnum {}

export enum NullEnum {}

export interface ReportTemplate {
    id: number;
    created_by: UserFormData;
    created_at: string;
    updated_at: string;
    title: string;
    description?: string;
    content_html: string;
    is_active?: boolean;
    is_recurring?: boolean;
    frequency?: FrequencyEnum | BlankEnum | NullEnum;
    auto_assign_to_roles?: number[];
}

export interface ReportTemplatePayload {
    title: string;
    description?: string;
    content_html: string;
    is_active?: boolean;
    is_recurring?: boolean;
    frequency?: FrequencyEnum | BlankEnum | NullEnum;
    auto_assign_to_roles?: number[];
}