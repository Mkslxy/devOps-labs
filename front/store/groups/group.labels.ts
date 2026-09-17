import {
    StatusEnum,
    AgeGroupEnum,
    KnowledgeLevelEnum,
} from "./group.type";

export const STATUS_LABELS: Record<StatusEnum, string> = {
    [StatusEnum.recruiting]: "Набір",
    [StatusEnum.active]: "Активна",
    [StatusEnum.finished]: "Завершена",
    [StatusEnum.archived]: "Архів",
};

export const AGE_GROUP_LABELS: Record<AgeGroupEnum, string> = {
    [AgeGroupEnum.kids]: "Діти",
    [AgeGroupEnum.teens]: "Підлітки",
    [AgeGroupEnum.adults]: "Дорослі",
};

export const KNOWLEDGE_LEVEL_LABELS: Record<KnowledgeLevelEnum, string> = {
    [KnowledgeLevelEnum.beginner]: "Beginner",
    [KnowledgeLevelEnum.elementary]: "Elementary",
    [KnowledgeLevelEnum.pre_intermediate]: "Pre-Intermediate",
    [KnowledgeLevelEnum.intermediate]: "Intermediate",
    [KnowledgeLevelEnum.upper_intermediate]: "Upper-Intermediate",
    [KnowledgeLevelEnum.advanced]: "Advanced",
};
