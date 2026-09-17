import {
    LessonCategoryEnum, LessonPlanReviewAction, LessonPlanStatusEnum,
} from "./lesson.type";

export const LESSON_CATEGORY_LABELS: Record<LessonCategoryEnum, string> = {
    [LessonCategoryEnum.standard]: "Стандартний",
    [LessonCategoryEnum.training]: "Тренування",
    [LessonCategoryEnum.staff_meeting]: "Загальна зустріч",
};

export const LESSON_PLAN_REVIEW_ACTION_LABELS: Record<LessonPlanReviewAction, string> = {
    [LessonPlanReviewAction.approve]: "Схвалено",
    [LessonPlanReviewAction.reject]: "Відхилено",
};

export const LESSON_PLAN_STATUS_LABELS: Record<LessonPlanStatusEnum, string> = {
    [LessonPlanStatusEnum.empty]: "Не створено",
    [LessonPlanStatusEnum.draft]: "Чернетка",
    [LessonPlanStatusEnum.on_review]: "На перевірці",
    [LessonPlanStatusEnum.changes_requested]: "Потрібні правки",
    [LessonPlanStatusEnum.approved]: "Схвалено",
};
