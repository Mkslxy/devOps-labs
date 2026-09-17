import {CategoryEnum} from "@/store/gradebook/gradebook.type";
import {UserFormData} from "@/store/users/user.type";

export interface Question {
    id: number;
    text: string;
    media_url?: string | null;
    points: number;
    type: TypeEnum;
    explanation: string;
    options: QuestionOption[];
}

export enum TypeEnum {
    single_choice = "single_choice",
    multiple_choice = "multiple_choice",
    open_text = "open_text",
    fill_in_the_blank = "fill_in_the_blank",
    matching = "matching",
    ordering = "ordering",
}


export enum AttemptStatusEnum {
    in_progress = "in_progress",
    completed = "completed",
    timed_out = "timed_out",
    abandoned = "abandoned",
}

export enum StatusDaeEnum {
    draft = "draft",
    published = "published",
    archived = "archived",
}

export interface QuestionOption {
    id?: number;
    option_text: string;
    is_correct?: boolean;
    explanation?: string;
    match_pair_text?: string;
    correct_order?: number;
    blank_group_id?: number;
}

export interface QuestionResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Question[];
}

export interface QuestionPayload {
    text: string;
    media_url?: string | null;
    points: number;
    type: TypeEnum;
    explanation: string;
    options: QuestionOption[];
}

export interface TeacherAttemptList {
    grade: Grade;
    id: number;
    student_id: number;
    student_name: string;
    student_email: string;
    test_title: string;
    assignment_id: number;
    status: AttemptStatusEnum;
    total_score_obtained: number;
    max_possible_score: number;
    is_passed: boolean;
    started_at: string;
    finished_at: string | null;
}

export interface TeacherAttemptListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: TeacherAttemptList[];
}
export interface StudentAnswerItem {
    id: number;
    selected_option: number | null;
    selected_option_text: string | null;
    text_response: string | null;
}

export interface StudentAnswer {
    id: number;
    question_text: string;
    question_points: number;
    score_awarded: number;
    teacher_comment: string | null;
    items: StudentAnswerItem[];
    correct_options: string;
}

export interface GradeFile {
    id: number;
    file: string;
    name: string;
}

export interface Grade {
    id: number;
    category: CategoryEnum;
    value?: number;
    comment?: string;
    student: number;
    column?: number;
    files: GradeFile[];
    created_at: string;
    created_by: UserFormData;
}

export interface StudentResultDetail {
    id: number;
    status: AttemptStatusEnum;
    grade: Grade;
    max_possible_score: number;
    answers: StudentAnswer[];
    show_answers: boolean;
}

export interface TestAnswerReviewPayload {
    score_awarded: number;
    teacher_comment: string;
}

export interface TestAnswerReviewResponse {
    score_awarded: number;
    teacher_comment: string;
}

export interface TestShort {
    id: number;
    title: string;
    description: string;
}

export interface TestVersionShort {
    id: number;
    test: number;
    time_limit_minutes: number;
    passing_score_percent: number;
    is_random_order: boolean;
    status: StatusDaeEnum;
}

export interface LessonTypeShort {
    id: number;
    name: string;
    slug: string;
    duration_minutes: number;
}

export interface UserShort {
    id: number;
    email: string;
    full_name: string;
    phone_country_code: string;
    phone_national_number: string;
    phone_normalized: string;
    date_of_birth: string;
}

export interface GroupShort {
    id: number;
    name: string;
    status: string;
    age_group: string;
    knowledge_level: string;
    teacher: number;
    students: UserShort[];
    is_online: boolean;
}

export interface LessonShort {
    id: number;
    topic: string;
    description: string;
    category: string;
    start_time: string;
    end_time: string;
    lesson_type: LessonTypeShort;
    group: GroupShort;
    teacher: UserShort;
    color_id: string;
    color_hex: string;
    meet_link: string;
    html_link: string;
    status: string;
    lesson_plan: string;
    created_by: number;
    created_at: string;
    is_online: boolean;
}

export interface MaterialFile {
    id: number;
    file: string;
    name: string;
}

export interface MaterialLink {
    id: number;
    url: string;
    name: string;
    is_video_embed: boolean;
}

export interface MaterialShort {
    id: number;
    topic: number;
    title: string;
    description: string;
    access_level: string;
    files: MaterialFile[];
    links: MaterialLink[];
    created_at: string;
    created_by: number;
}

export interface TestAssignment {
    id: number;
    test: TestShort;
    pinned_version: TestVersionShort | null;
    lesson: LessonShort | null;
    material: MaterialShort | null;
    group?: GroupShort | null;

    custom_time_limit: number | null;
    custom_passing_score: number | null;
    starting_at: string;
    closing_at: string | null;
    created_at: string;
    show_answers: boolean;
}

export interface TestAssignmentResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: TestAssignment[];
}

export interface TestAssignmentPayload {
    test_id: number;
    pinned_version_id?: number | null;
    lesson_id?: number | null;
    material_id?: number | null;
    group_id?: number | null;

    custom_time_limit?: number | null;
    custom_passing_score?: number | null;

    starting_at: string;
    closing_at?: string | null;

    show_answers: boolean;
}

export interface TestVersionList {
    id: number;
    test: number;
    time_limit_minutes: number;
    passing_score_percent: number;
    is_random_order: boolean;
    status: string;
}

export interface TestVersionListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: TestVersionList[];
}

export interface TestVersionDetail {
    id: number;
    test: number;
    time_limit_minutes: number;
    passing_score_percent: number;
    is_random_order: boolean;
    questions: Question[];
    status: string;
}

export interface TestVersionUpdatePayload {
    time_limit_minutes: number;
    passing_score_percent: number;
    is_random_order: boolean;
    status: string;
}

export interface TestVersionQuestionIdsPayload {
    question_ids: number[];
}

export interface TestManagement {
    id: number;
    title: string;
    description: string;
    current_version: TestVersionShort;
}

export interface TestManagementResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: TestManagement[];
}

export interface TestCreatePayload {
    title: string;
    description: string;
}

export interface TestVersionDetailResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: TestVersionDetail[];
}

export interface StartAttemptPayload {
    assignment_id: number;
}

export type StartAttemptResponse =
    | { assignment_id: number; attempt_id?: number }
    | { attempt_id: number; detail?: string };

export interface TestTakingAttemptQuestion {
    id: number;
    text: string;
    media_url: string | null;
    points: number;
    type: TypeEnum;
    options: Array<{ id: number; option_text: string }>;
}

export interface TestTakingAttemptDetail {
    id: number;
    status: AttemptStatusEnum;
    test_title: string;
    test_description: string;
    started_at: string;

    deadline: string;
    remaining_seconds: string;
    questions: TestTakingAttemptQuestion[];
}

export interface FinishAttemptAnswerPayload {
    question_id: number;
    selected_option_ids?: number[];
    text_response?: string;
}

export interface FinishAttemptPayload {
    answers: FinishAttemptAnswerPayload[];
}

export interface FinishAttemptResponse {
    answers: FinishAttemptAnswerPayload[];
}

export type TestTakingReviewResponse = StudentResultDetail;

export interface TestTakingTestList {
    id: number;
    title: string;
    description: string;
    time_limit_minutes: number;
    passing_score_percent: number;
}

export interface TestTakingTestsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: TestTakingTestList[];
}

export interface TestTakingQuestionPreview {
    id: number;
    text: string;
    media_url: string | null;
    points: number;
    type: TypeEnum;
    options: string;
}

export interface TestTakingTestDetail {
    id: number;
    title: string;
    description: string;
    time_limit_minutes: number;
    passing_score_percent: number;
    questions: TestTakingQuestionPreview[];
}


export type QuestionsListParams = {
    page?: number;
    ordering?: string;
    page_size?: number;
    created_by?: number;
};

export type StudentResultsListParams = {
    page?: number;
    assignment?: number;
    student?: number;
    test_version?: number;
    status?: "abandoned" | "completed" | "in_progress" | "timed_out";
};

export type TestAssignmentsListParams = {
    page?: number;
    page_size?: number;
    lesson?: number;
    material?: number;
    test?: number;
    created_by?: number;
};

export type TestVersionsListParams = {
    page?: number;
    ordering?: string;
    test?: number;
    page_size?: number;
    created_by?: number
}

export type TestsListParams = {
    page?: number;
    ordering?: string;
    search?: string;
};

export type TakingTestsListParams = {
    page?: number;
    page_size?: number;
    ordering?: string;
};
