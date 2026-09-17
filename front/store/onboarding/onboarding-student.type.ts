export enum OnboardingStudentResultStatusEnum {
    in_progress = "in_progress",
    completed = "completed",
    timed_out = "timed_out",
    abandoned = "abandoned",
}

export interface OnboardingStudentResult {
    id: number;
    student_id: number;
    student_name: string;
    student_email: string;
    test_title: string;
    assignment_id: number;
    status: OnboardingStudentResultStatusEnum;
    score: number;
    max_possible_score: number;
    is_passed: boolean;
    started_at: string;
    finished_at: string | null;
}

export interface OnboardingStudentResultItem {
    id: number;
    selected_option: number | null;
    selected_option_text: string | null;
    text_response: string | null;
}

export interface OnboardingStudentResultAnswer {
    id: number;
    question_text: string;
    question_points: number;
    score_awarded: number;
    teacher_comment: string | null;
    items: OnboardingStudentResultItem[];
    correct_options: string;
}

export interface OnboardingStudentResultDetail {
    id: number;
    status: OnboardingStudentResultStatusEnum;
    score: number;
    max_possible_score: number;
    answers: OnboardingStudentResultAnswer[];
}