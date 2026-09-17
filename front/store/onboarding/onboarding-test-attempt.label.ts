import {OnboardingTestAttemptStatusEnum} from "@/store/onboarding/onboarding-test-attempt.type";

export const ONBOARDING_TEST_ATTEMPT_STATUS_LABELS: Record<OnboardingTestAttemptStatusEnum, string> = {
    [OnboardingTestAttemptStatusEnum.in_progress]: "В процесі",
    [OnboardingTestAttemptStatusEnum.completed]: "Завершено",
    [OnboardingTestAttemptStatusEnum.timed_out]: "Час вийшов",
    [OnboardingTestAttemptStatusEnum.abandoned]: "Покинуто",
};