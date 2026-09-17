export interface MagicCoursePayload {
    file: File;
}

export interface MagicTask {
    title: string;
    description?: string;
}

export interface MagicMaterial {
    title: string;
    description?: string;
}

export interface MagicCourseTopic {
    title: string;
    content_description?: string;
    materials: MagicMaterial[];
    tasks: MagicTask[];
}

export interface MagicCourseModule {
    title: string;
    topics: MagicCourseTopic[];
}

export interface MagicCourseResponse {
    course_title: string;
    course_description?: string;
    level: string;
    modules: MagicCourseModule[];
}