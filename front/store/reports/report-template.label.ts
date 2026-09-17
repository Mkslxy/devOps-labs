import {FrequencyEnum} from "@/store/reports/report-template.type";

export const FREQUENCY_TYPE_LABELS: Record<FrequencyEnum, string> = {
    [FrequencyEnum.weekly]: "Тиждень",
    [FrequencyEnum.daily]: "День",
    [FrequencyEnum.monthly]: "Місяць",
};
