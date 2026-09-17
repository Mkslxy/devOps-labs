import {OnboardingTestVersionStatusEnum} from "@/store/onboarding/onboarding-test-assignment.type";

export const ONBOARDING_TEST_VERSION_STATUS_LABELS: Record<OnboardingTestVersionStatusEnum, string> = {
    [OnboardingTestVersionStatusEnum.draft]: "Чернетка",
    [OnboardingTestVersionStatusEnum.published]: "Опубліковано",
    [OnboardingTestVersionStatusEnum.archived]: "Архівовано",
};