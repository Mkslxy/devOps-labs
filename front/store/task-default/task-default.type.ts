import {Topic} from "@/store/topic/topic.type";
import {UserFormData} from "@/store/users/user.type";
import {GradeBookGrade} from "@/store/gradebook/gradebook.type";

//TASK CRUD

export interface TaskFile {
    id: number;
    file: string;
    name?: string;
}

export interface TaskLink {
    id: number;
    url: string;
    name?: string;
    is_video_embed?: string;
}

export interface Task {
    id: number;
    title?: string;
    description?: string;
    topic: Topic;
    files: TaskFile[];
    links: TaskLink[];
    created_at: string;
    updated_at: string;
    deadline?: string;
    created_by: UserFormData;
}

export interface TaskResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Task[];
}

export interface TaskPayload {
    title?: string;
    description?: string;
    topic_id?: number;
    uploaded_files?: string[];
    deleted_file_ids?: number[];
    links_json?: string;
    deleted_link_ids?: number[];
    deadline?: string;
}

//TASK CRUD

//TASK CRUD SUBMISSION STUDENT

export interface TaskForSubmission {
    id: number;
    title?: string;
    description?: string;
    deadline?: string;
}

export interface TaskSubmissionFile {
    id: number;
    file: string;
    name?: string;
}

export interface TaskSubmission {
    id: number;
    task: TaskForSubmission;
    student: UserFormData;
    submission_text: string;
    files: TaskSubmissionFile[];
    grade: GradeBookGrade;
    created_at: string;
    updated_at: string;
}

export interface TaskSubmissionResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: TaskSubmission[];
}

export interface TaskSubmissionPayload {
    task_id: number;
    submission_text?: string;
    uploaded_files?: Array<File | string>;
    deleted_files_ids?: number[];
}


//TASK CRUD SUBMISSION STUDENT

//TASK CRUD SUBMISSION REVIEW

export interface TaskSubmissionFileReview {
    id: number;
    file: string;
    name?: string;
}

export interface TaskForSubmissionReview {
    id: number;
    title?: string;
    description?: string;
    deadline?: string;
}

export interface TaskReview {
    id: number;
    task: TaskForSubmissionReview;
    student: UserFormData;
    submission_text: string;
    files: TaskSubmissionFileReview[];
    grade: GradeBookGrade;
    created_at: string;
    updated_at: string;
}

export interface TaskReviewResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: TaskReview[];
}

export interface RateTaskSubmissionPayload {
    value?: number;
    comment?: string;
    uploaded_files?: string[];
    deleted_file_ids?: number[];
}

//TASK CRUD SUBMISSION REVIEW
