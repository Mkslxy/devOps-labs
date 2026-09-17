import type { UserFormData } from "@/store/users/user.type";

export interface Training {
    id: number;
    title: string;
    description?: string;
    type: "training";

    attendees: UserFormData[]; // ✅ масив
    start_time: string;
    end_time: string;

    color_id: string;
    color_hex: string;

    meet_link: string;
    html_link: string;

    is_online?: boolean;

    created_by: UserFormData;
    created_at: string;
    updated_at: string;
}

export interface TrainingResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Training[];
}

export interface TrainingPayload {
    title: string;
    description?: string;
    attendee_ids: number[];
    start_time: string;
    end_time: string;
    color_id?: string;
    is_online?: boolean;
}

export interface TrainingListParams {
    page?: number;
    search?: string;

    created_at_after?: string;
    created_at_before?: string;
    updated_at_after?: string;
    updated_at_before?: string;

    created_by?: number;
    is_online?: boolean;

    page_size?: number;
    start?: string;
    end?: string;
}
