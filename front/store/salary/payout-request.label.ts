import {PayoutRequestEnum} from "@/store/salary/payout-request.type";

export const PAYOUT_REQUEST_TYPE_LABELS: Record<PayoutRequestEnum, string> = {
    [PayoutRequestEnum.pending]: "В очікуванні",
    [PayoutRequestEnum.paid]: "Проплачено",
    [PayoutRequestEnum.rejected]: "Відмовлено",
    [PayoutRequestEnum.cancelled]: "Скасовано",
};
