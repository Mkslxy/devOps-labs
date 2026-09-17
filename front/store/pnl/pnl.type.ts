//CATEGORY

import {School} from "@/store/school/school.type";

export interface Category {
    id: number;
    name: string;
}

export interface CategoryResponse {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Category[];
}

export interface CategoryPayload {
    name: string;
}

//CATEGORY


//CURRENCY

export interface Currency {
    id: number;
    code: string;
    name: string;
    symbol: string;
}

export interface CurrencyResponse {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Currency[];
}

export interface CurrencyPayload {
    code: string;
    name: string;
    symbol: string;
}

//CURRENCY


//PAYMENT METHOD

export interface PaymentMethod {
    id: number;
    name: string;
}

export interface PaymentMethodResponse {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: PaymentMethod[];
}

export interface PaymentMethodPayload {
    name: string;
}

//PAYMENT METHOD


//SUBCATEGORY

export interface SubCategory {
    id: number;
    category: Category;
    name: string;
}

export interface SubCategoryResponse {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: SubCategory[];
}

export interface SubCategoryPayload {
    category_id: number;
    name: string;
}

//SUBCATEGORY


//TRANSACTION

export enum TransactionTypeEnum {
    income = "income",
    expense = "expense",
}

export interface Transaction {
    id: number;
    category: Category;
    subcategory: SubCategory;
    payment_method: PaymentMethod;
    currency: Currency;
    school: School;
    created_at: string;
    updated_at: string;
    amount: string;
    type: TransactionTypeEnum;
    description: string;
}

export interface TransactionResponse {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Transaction[];
}

export interface TransactionPayload {
    category_id: number;
    subcategory_id: number | null;
    payment_method_id: number;
    currency_id: number;
    school_id: number;
    amount: string;
    type: TransactionTypeEnum;
    description: string;
}

//TRANSACTION


//PNL COMPANY BALANCE

export interface CompanyBalance {
    id: number;
    currency: Currency;
    created_at: string;
    updated_at: string;
    balance?: string;
}

export interface CompanyBalanceResponse {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: CompanyBalance[];
}

//PNL COMPANY BALANCE


//PNL SCHOOL BALANCE

export interface SchoolBalance {
    id: number;
    school: School;
    currency: Currency;
    created_at: string;
    updated_at: string;
    balance?: string;
}

export interface SchoolBalanceResponse {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: SchoolBalance[];
}

//PNL SCHOOL BALANCE
