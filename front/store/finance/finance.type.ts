export interface CreateInvoicePayload {
    plan_id: number;
}

export interface CreateTopUpInvoicePayload {
    subscription_id: number;
    lessons_count: number;
}

export interface CreateInvoiceResponse {
    invoiceUrl: string;
    reason: string;
    reasonCode: number;
    qrCode: string;
}
