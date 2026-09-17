import {
    AccessLevelEnum,
} from "./material.type";

export const MATERIAL_LABELS: Record<AccessLevelEnum, string> = {
    [AccessLevelEnum.public]: "Публічна",
    [AccessLevelEnum.students]: "Студентам",
    [AccessLevelEnum.teachers]: "Вчителям",
    [AccessLevelEnum.group_only]: "Тільки для груп",
    [AccessLevelEnum.course_only]: "Тільки для курсів",
    [AccessLevelEnum.admins]: "Адмінам"
};
