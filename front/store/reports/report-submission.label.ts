import {ReportSubmissionEnum} from "@/store/reports/report-submission.type";

export const REPORT_SUBMISSION_TYPE_LABELS: Record<ReportSubmissionEnum, string> = {
    [ReportSubmissionEnum.draft]: "Чернетка",
    [ReportSubmissionEnum.submitted]: "Відправлено на перевірку",
    [ReportSubmissionEnum.rejected]: "Відхилено (Потребує правок)",
    [ReportSubmissionEnum.approved]: "Прийнято",
};
