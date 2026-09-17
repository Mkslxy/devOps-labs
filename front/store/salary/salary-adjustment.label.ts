import {SalaryAdjustmentTypeEnum} from "@/store/salary/salary-adjustment.type";

export const SALARY_ADJUSTMENT_TYPE_LABELS: Record<SalaryAdjustmentTypeEnum, string> = {
    [SalaryAdjustmentTypeEnum.penalty]: "Покарання",
    [SalaryAdjustmentTypeEnum.bonus]: "Бонус",
};
