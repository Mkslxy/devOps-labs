import {AttemptStatusEnum, StatusDaeEnum, TypeEnum} from "@/store/test-management/test-management.type";

export const TYPE_LABELS: Record<TypeEnum, string> = {
    [TypeEnum.single_choice]: "Одна правильна відповідь",
    [TypeEnum.multiple_choice]: "Кілька правильних відповідей",
    [TypeEnum.open_text]: "Відкрита відповідь",
    [TypeEnum.fill_in_the_blank]: "Заповнення пропусків",
    [TypeEnum.matching]: "Встановлення відповідностей",
    [TypeEnum.ordering]: "Упорядкування",
} as const satisfies Record<TypeEnum, string>;

export const ATTEMPT_STATUS_LABELS: Record<AttemptStatusEnum, string> = {
    [AttemptStatusEnum.in_progress]: "Проходить тест",
    [AttemptStatusEnum.completed]: "Тест завершено",
    [AttemptStatusEnum.timed_out]: "Час на тест вичерпано",
    [AttemptStatusEnum.abandoned]: "Тест перервано",
} as const satisfies Record<AttemptStatusEnum, string>;


export const STATUS_DAE_LABELS: Record<StatusDaeEnum, string> = {
    [StatusDaeEnum.draft]: "Чернетка",
    [StatusDaeEnum.published]: "Опубліковано",
    [StatusDaeEnum.archived]: "Архівовано",
} as const satisfies Record<StatusDaeEnum, string>;
