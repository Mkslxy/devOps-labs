import {Currency} from "@/store/pnl/pnl.type";

export interface Book {
    id: number;
    currency: Currency;
    created_at: string;
    update_at: string;
    name: string;
    description?: string;
    amount?: number;
    price: number;
}

export interface BookPayload {
    currency_id: number;
    name: string;
    description?: string;
    amount?: number;
    price: number;
}