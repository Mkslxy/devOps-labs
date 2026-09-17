export interface Material {
    id: number;
    topic?: number;
    title?: string;
    description?: string;
    access_level?: AccessLevelEnum;
    files: MaterialFile[];
    links: MaterialLinks[];
    created_at: string;
    created_by: number;
}

export interface MaterialListParams {
    page?: number;
    page_size?: number;
    ordering?: string;
}

export interface MaterialPayload {
    topic?: number;
    title?: string;
    description?: string;
    access_level?: AccessLevelEnum;

    uploaded_files?: File[];
    deleted_file_ids?: number[];
    links_json?: string;
    deleted_link_ids?: number[];
}

export enum AccessLevelEnum {
    public = "public",
    students = "students",
    teachers = "teachers",
    group_only = "group_only",
    course_only = "course_only",
    admins = "admins",
}

export interface MaterialFile{
    id: number;
    file: string;
    name: string;
}

export interface MaterialLinks{
    id: number;
    url: string;
    name: string;
    is_video_embed:boolean;
}

export interface MaterialResponse{
    count: number;
    next: string;
    previous: string;
    results: Material[];
}


