import {UserShort} from "@/store/test-management/test-management.type";

export interface Module {
    id: number;
    title: string;
    course: number;
    course_data: CourseShort;
    created_by: UserShort;
}

export interface CourseShort {
    id: number;
    title: string;
}

export interface ModuleResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Module[];
}

export interface ModulePayload {
    title: string;
    course: number;
}