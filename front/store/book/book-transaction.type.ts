import {Book} from "@/store/book/book.type";
import {Currency, PaymentMethod} from "@/store/pnl/pnl.type";
import {UserFormData} from "@/store/users/user.type";

export enum BookTransactionTypeEnum {
    buy = "buy",
    sell = "sell",
}

export interface BookTransaction {
    id: number;
    book: Book;
    currency: Currency;
    payment_method: PaymentMethod;
    created_by: UserFormData;
    type: BookTransactionTypeEnum;
    price: string;
    amount: number;
    created_at: string;
    updated_at: string;
    finance_transaction: string;
}

export interface BookTransactionPayload {
    book_id: number;
    payment_method_id: number;
    type: BookTransactionTypeEnum;
    amount: number;
    finance_transaction?: number;
}