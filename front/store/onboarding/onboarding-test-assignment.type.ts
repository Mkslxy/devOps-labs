import { UserFormData } from "@/store/users/user.type";

export enum OnboardingTestVersionStatusEnum {
    draft = "draft",
    published = "published",
    archived = "archived",
}

export interface OnboardingTestAssignmentTest {
    id: number;
    title: string;
    description: string;
}

export interface OnboardingTestAssignmentPinnedVersion {
    id: number;
    test: number;
    time_limit_minutes: number;
    passing_score_percent: number;
    is_random_order: boolean;
    status: OnboardingTestVersionStatusEnum;
    created_by: UserFormData;
}

export interface OnboardingTestAssignment {
    id: number;
    public_uid: string;
    test: OnboardingTestAssignmentTest;
    pinned_version: OnboardingTestAssignmentPinnedVersion;
    custom_time_limit: number;
    custom_passing_score: number;
    show_answers: boolean;
    created_at: string;
    starting_at: string;
    closing_at: string;
    created_by: UserFormData;
}

export interface OnboardingTestAssignmentPayload {
    test_id: number;
    pinned_version_id: number;
    custom_time_limit: number;
    custom_passing_score: number;
    show_answers: boolean;
    starting_at: string;
    closing_at: string;
}

export interface TestAssignmentLinkAccess {
    id: number;
    public_uid: string;
    title: string;
    description: string;
    starting_at: string;
    closing_at: string;
    time_limit_minutes: string;
    passing_score_percent: string;
}