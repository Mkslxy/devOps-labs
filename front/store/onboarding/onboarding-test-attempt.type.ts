export enum OnboardingTestAttemptStatusEnum {
    in_progress = "in_progress",
    completed = "completed",
    timed_out = "timed_out",
    abandoned = "abandoned",
}

export interface OnboardingTestAttemptCreatePayload {
    assignment_id: number;
    email: string;
    name: string;
}

export interface OnboardingTestAttemptCreateResponse {
    assignment_id: number;
    email: string;
    name: string;
}

export interface OnboardingTestAttempt {
    id: number;
    status: OnboardingTestAttemptStatusEnum;
    test_title: string;
    test_description: string;
    started_at: string;
    deadline: string;
    remaining_seconds: string;
    questions: string;
}

export interface OnboardingTestAttemptAnswerPayload {
    question_id: number;
    selected_option_ids?: number[];
    text_response?: string;
}

export interface OnboardingTestAttemptFinishPayload {
    answers: OnboardingTestAttemptAnswerPayload[];
}

export interface OnboardingTestAttemptFinishResponse {
    answers: OnboardingTestAttemptAnswerPayload[];
}

export interface OnboardingTestAttemptReviewItem {
    id: number;
    selected_option: number | null;
    selected_option_text: string | null;
    text_response: string | null;
}

export interface OnboardingTestAttemptReviewAnswer {
    id: number;
    question_text: string;
    question_points: number;
    score_awarded: number;
    teacher_comment: string | null;
    items: OnboardingTestAttemptReviewItem[];
    correct_options: string;
}

export interface OnboardingTestAttemptReview {
    id: number;
    status: OnboardingTestAttemptStatusEnum;
    score: number;
    max_possible_score: number;
    answers: OnboardingTestAttemptReviewAnswer[];
}