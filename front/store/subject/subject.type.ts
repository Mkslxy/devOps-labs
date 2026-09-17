export interface Subject {
    id: number;
    created_at: string;
    updated_at: string;
    name: string;
    slug: string;
}

export interface SubjectPayload {
    name: string;
}

export interface SubjectResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Subject[];
}

export interface SubjectListParams {
    page?: number;
    page_size?: number;
}