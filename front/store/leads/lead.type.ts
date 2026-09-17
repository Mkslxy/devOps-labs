import {UserFormData} from "@/store/users/user.type";

//CALLBACK CRUD ( GET )

export enum ContactPreferenceEnum {
    phone = "phone",
    email = "email",
    other = "other",
}
export enum CallBackRequestStatusEnum {
    new = "new",
    in_progress = "in_progress",
    converted = "converted",
    rejected = "rejected",
    archived = "archived",
}

export interface CallBack {
    id: number;
    processed_by: UserFormData;
    created_at: string;
    updated_at: string;
    full_name: string;
    email?: string;
    phone_country_code: string;
    phone_national_number: string;
    phone_normalized: string;
    message?: string;
    contact_preference?: ContactPreferenceEnum[];
    other_contact_preference?: string;
    status?: CallBackRequestStatusEnum[];
    callback_page: string;
    city?: string;
    manager_comment?: string;
    converted_lead?: number;
}

export interface CallBackResponse {
    count: number;
    next: string;
    previous: string;
    results: CallBack[];
}

//CALLBACK CRUD ( GET )

//CALLBACK CRUD ( POST )

export interface CallBackPayload {
    full_name: string;
    email?: string;
    phone_country_code: string;
    phone_national_number: string;
    message?: string;
    contact_preference?: ContactPreferenceEnum[];
    other_contact_preference?: string;
    status?: CallBackRequestStatusEnum[];
    callback_page: string;
    city?: string;
    manager_comment?: string;
    converted_lead?: number;
}

//CALLBACK CRUD ( POST )

//CALLBACK CRUD ( POST - CONVERTED TO LEAD )

export enum LeadStatusEnum {
    new = "new",
    processing = "processing",
    converted = "converted",
    rejected = "rejected",
}

export interface ConvertedLeadPayload{
    id: number;
    manager: UserFormData;
    created_at: string;
    updated_at: string;
    name: string;
    email?: string;
    phone?: string;
    source: string;
    status?: LeadStatusEnum[];
    notes?: string;
}

//CALLBACK CRUD ( POST - CONVERTED TO LEAD )

//LEADS CRUD ( POST - CONVERTED TO LEAD )

export interface Lead {
    id: number;
    manager: UserFormData;
    created_at: string;
    updated_at: string;
    name: string;
    email?: string;
    phone?: string;
    source: string;
    status?: LeadStatusEnum[];
    notes?: string;
    city?: string;
}

export interface LeadPayload {
    manager_id?: number;
    name: string;
    email?: string;
    phone?: string;
    source: string;
    status?: LeadStatusEnum[];
    notes?: string;
    city?: string;
}

export interface LeadResponse {
    count: number;
    next: string;
    previous: string;
    results: Lead[];
}

//CALLBACK CRUD ( POST - CONVERTED TO LEAD )