import {ReportTemplate} from "@/store/reports/report-template.type";
import {UserFormData} from "@/store/users/user.type";

export enum ReportRequestEnum {
    pending = "pending",
    submitted = "submitted",
    overdue = "overdue",
    cancelled = "cancelled",
}

export interface ReportRequest {
    id: number;
    template: ReportTemplate;
    assigned_to: UserFormData;
    created_by: UserFormData;
    deadline: string;
    status: ReportRequestEnum;
    is_overdue: boolean;
    created_at: string;
}

export interface ReportRequestPayload {
    template_id: number;
    assigned_to_id: number;
    deadline: string;
}