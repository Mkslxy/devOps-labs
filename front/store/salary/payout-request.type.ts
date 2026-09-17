export enum PayoutRequestEnum {
    pending = "pending",
    paid = "paid",
    rejected = "rejected",
    cancelled = "cancelled"
}

export interface PayoutRequest {
    id: number;
    user: number;
    amount: number;
    status: PayoutRequestEnum;
    admin_comment: string;
    created_at: string;
    paid_at: string;
}

export interface PayoutRequestPayload {
    amount: string;
}

export interface PayoutRequestApprove {
    payment_method_id: number;
    admin_comment?: string;
}

export interface PayoutRequestCancel {
    id: number;
    user: number;
    amount: number;
    status: PayoutRequestEnum;
    admin_comment: string;
    created_at: string;
    paid_at: string;
}

export interface PayoutRequestReject {
    admin_comment: string;
}