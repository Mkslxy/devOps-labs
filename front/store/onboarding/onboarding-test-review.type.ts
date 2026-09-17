export interface OnboardingTestAnswerReviewPayload {
    score_awarded: number;
    teacher_comment?: string;
}

export interface OnboardingTestAnswerReviewResponse {
    score_awarded: number;
    teacher_comment: string;
}