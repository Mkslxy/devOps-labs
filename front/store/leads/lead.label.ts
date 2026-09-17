import {CallBackRequestStatusEnum, ContactPreferenceEnum, LeadStatusEnum} from "@/store/leads/lead.type";

export const CALLBACK_REQUEST_LABELS: Record<CallBackRequestStatusEnum, string> = {
    [CallBackRequestStatusEnum.new]: "Новий",
    [CallBackRequestStatusEnum.in_progress]: "В прогресі",
    [CallBackRequestStatusEnum.converted]: "Конвертований в ліда",
    [CallBackRequestStatusEnum.rejected]: "Відмовлено",
    [CallBackRequestStatusEnum.archived]: "Архівовано",
};

export const CALLBACK_PREFERENCE_LABELS: Record<ContactPreferenceEnum, string> = {
    [ContactPreferenceEnum.phone]: "Телефон",
    [ContactPreferenceEnum.email]: "Пошта",
    [ContactPreferenceEnum.other]: "Інше",
};

export const LEAD_STATUS_LABELS: Record<LeadStatusEnum, string> = {
    [LeadStatusEnum.new]: "Новий",
    [LeadStatusEnum.processing]: "В прогресі",
    [LeadStatusEnum.rejected]: "Відмовлено",
    [LeadStatusEnum.converted]: "Конвертований в ліда",
};
