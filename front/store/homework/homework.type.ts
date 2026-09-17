import {Lesson} from "@/store/lessons/lesson.type";
import {UserFormData} from "@/store/users/user.type";
import {Group} from "@/store/groups/group.type";
import {Grade} from "@/store/test-management/test-management.type";

//Teacher interface

export interface HomeWorkFile {
    id: number;
    file: string;
    name?: string;
}

export interface HomeWorkLink {
    id: number;
    url: string;
    name?: string;
    is_video_embed?: boolean;
}

export interface Homework {
    id: number;
    title: string;
    description?: string;
    deadline: string;
    lesson: Lesson;
    student: UserFormData;
    group: Group;
    files: HomeWorkFile[];
    links: HomeWorkLink[];
    created_at: string;
    updated_at: string;
    created_by: UserFormData;
}

export interface HomeworkPayload{
    title: string;
    description?: string;
    deadline: string;
    lesson_id?: number;
    student_id?: number;
    group_id?: number;
    uploaded_files?: string[];
    deleted_file_ids?: string[];
    links_json?: string[];
    delete_link_ids?: string[];
}

export interface HomeworkResponse {
    count: number;
    next: string;
    previous: string;
    results: Homework[];
}

export interface HomeWorkSub{
    id: number;
    title: string;
    description?: string;
    deadline: string;
}

export interface HomeWorkSubmissionReview{
    id: number;
    homework: HomeWorkSub;
    student: UserFormData;
    submission_text: string;
    files: HomeWorkFile[];
    grade: Grade;
    created_at: string;
    update_at: string;
}

export interface HomeWorkSubmissionReviewResponse{
    count: number;
    next: string;
    previous: string;
    results: HomeWorkSubmissionReview[];
}

//Student interface

export interface HomeWorkSubmission {
    id: number;
    homework: Homework;
    student: UserFormData;
    submission_text?: string;
    files: HomeWorkFile[];
    grade: Grade;
    created_at: string;
    updated_at: string;
}

export interface HomeWorkSubmissionPayload {
    homework_id: number;
    submission_text?: string;
    uploaded_files?: File[];
    deleted_file_ids?: string[];
}

export interface HomeWorkSubmissionResponse {
    count: number;
    next: string;
    previous: string;
    results: HomeWorkSubmission[];
}



