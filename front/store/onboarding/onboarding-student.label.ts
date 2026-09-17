import { OnboardingStudentResultStatusEnum } from "./onboarding-student.type";

export const ONBOARDING_STUDENT_RESULT_STATUS_LABELS: Record<OnboardingStudentResultStatusEnum, string> = {
    [OnboardingStudentResultStatusEnum.in_progress]: "В процесі",
    [OnboardingStudentResultStatusEnum.completed]: "Завершено",
    [OnboardingStudentResultStatusEnum.timed_out]: "Час вийшов",
    [OnboardingStudentResultStatusEnum.abandoned]: "Покинуто",
};