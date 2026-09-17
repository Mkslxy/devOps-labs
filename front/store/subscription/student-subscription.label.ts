import {StudentSubscriptionStatusEnum} from "@/store/subscription/student-subscription.type";

export const STUDENT_SUBSCRIPTION_STATUS_LABELS: Record<StudentSubscriptionStatusEnum, string> = {
    [StudentSubscriptionStatusEnum.pending_assignment]: "Очікує призначення",
    [StudentSubscriptionStatusEnum.active]: "Активний",
    [StudentSubscriptionStatusEnum.frozen]: "Заморожений",
    [StudentSubscriptionStatusEnum.completed]: "Завершено",
    [StudentSubscriptionStatusEnum.cancelled]: "Скасовано",
};
