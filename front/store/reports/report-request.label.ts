import {ReportRequestEnum} from "@/store/reports/report-request.type";

export const REPORT_REQUEST_TYPE_LABELS: Record<ReportRequestEnum, string> = {
    [ReportRequestEnum.pending]: "Очікує задачі",
    [ReportRequestEnum.submitted]: "Здано",
    [ReportRequestEnum.cancelled]: "Прострочено",
    [ReportRequestEnum.overdue]: "Скасовано",
};
