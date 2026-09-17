export interface School {
    id: number;
    name: string;
    address: string;
    city: string;
    latitude?: string;
    longitude?: string;
}

export interface SchoolResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: School[];
}

export interface SchoolPayload {
    name: string;
    address: string;
    city: string;
    latitude?: string;
    longitude?: string;
}