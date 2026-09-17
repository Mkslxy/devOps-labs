import {UserFormData} from "@/store/users/user.type";

export interface Topic {
    id: number;
    title: string;
    content_description: string;
    module: number;
    module_data:{
        id: number;
        title?: string;
    }
    created_by: UserFormData;
}

export interface TopicResponse {
    count: number;
    next: string;
    previous: string;
    results: Topic[];
}

export interface TopicPayload {
    title: string;
    content_description: string;
    module: number;
}