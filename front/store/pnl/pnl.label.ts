import {TransactionTypeEnum} from "@/store/pnl/pnl.type";

export const STATUS_LABELS: Record<TransactionTypeEnum, string> = {
    [TransactionTypeEnum.income]: "Дохід",
    [TransactionTypeEnum.expense]: "Витрати",
};
