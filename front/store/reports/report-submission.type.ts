import {ReportTemplate} from "@/store/reports/report-template.type";
import {UserFormData} from "@/store/users/user.type";

export enum ReportSubmissionEnum {
    draft = "draft",
    submitted = "submitted",
    approved = "approved",
    rejected = "rejected",
}

export interface ReportSubmission {
    id: number;
    template: ReportTemplate;
    request?: number;
    created_by: UserFormData;
    answers: Record<string, unknown>;
    status: ReportSubmissionEnum;
    reviewer_comment: string;
    reviewed_at: string;
    reviewed_by: UserFormData;
    created_at: string;
}

export interface ReportSubmissionPayload {
    template_id: number;
    request_id?: number | null;
    answers: Record<string, unknown>;
}

export interface ReportSubmissionReviewPayload {
    status: ReportSubmissionEnum;
    reviewer_comment: string;
}