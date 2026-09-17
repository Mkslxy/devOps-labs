"use client";

import { baseApi } from "@/store/baseApi";
import type {
    Category,
    CategoryPayload,
    CategoryResponse, CompanyBalance, CompanyBalanceResponse,
    Currency,
    CurrencyPayload,
    CurrencyResponse,
    PaymentMethod,
    PaymentMethodPayload,
    PaymentMethodResponse, SchoolBalance, SchoolBalanceResponse,
    SubCategory,
    SubCategoryPayload,
    SubCategoryResponse,
    Transaction,
    TransactionPayload,
    TransactionResponse,
    TransactionTypeEnum,
} from "./pnl.type";

export const pnlApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // =========================
        // CATEGORY ( CRUD )
        // =========================
        getPnlCategories: builder.query<
            CategoryResponse,
            {
                page?: number;
                ordering?: "id" | "-id" | "name" | "-name";
                name?: string;
                format?: "json" | "xlsx";
            }
        >({
            query: (params) => ({
                url: "/pnl/category/",
                method: "GET",
                params,
            }),
            providesTags: [{ type: "PnlCategory", id: "LIST" }],
        }),

        getPnlCategoryById: builder.query<Category, { id: number; format?: "json" | "xlsx" }>({
            query: ({ id, format }) => ({
                url: `/pnl/category/${id}/`,
                method: "GET",
                params: format ? { format } : undefined,
            }),
            providesTags: (res, err, arg) => [{ type: "PnlCategory", id: arg.id }],
        }),

        createPnlCategory: builder.mutation<Category, CategoryPayload>({
            query: (body) => {
                const formData = new FormData();
                formData.append("name", body.name);

                return {
                    url: "/pnl/category/",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: [{ type: "PnlCategory", id: "LIST" }],
        }),

        updatePnlCategory: builder.mutation<Category, { id: number; data: Partial<CategoryPayload> }>({
            query: ({ id, data }) => {
                const formData = new FormData();
                if (data.name) formData.append("name", data.name);

                return {
                    url: `/pnl/category/${id}/`,
                    method: "PATCH",
                    body: formData,
                };
            },
            invalidatesTags: (res, err, arg) => [
                { type: "PnlCategory", id: "LIST" },
                { type: "PnlCategory", id: arg.id },
            ],
        }),

        deletePnlCategory: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `/pnl/category/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (res, err, arg) => [
                { type: "PnlCategory", id: "LIST" },
                { type: "PnlCategory", id: arg.id },
            ],
        }),

        // =========================
        // CURRENCY ( CRUD )
        // =========================
        getPnlCurrencies: builder.query<
            CurrencyResponse,
            {
                page?: number;
                page_size?: number;
                ordering?: "id" | "-id" | "code" | "-code" | "name" | "-name";
                code?: string;
                name?: string;
                format?: "json" | "xlsx";
            }
        >({
            query: (params) => ({
                url: "/pnl/currency/",
                method: "GET",
                params,
            }),
            providesTags: [{ type: "PnlCurrency", id: "LIST" }],
        }),

        getPnlCurrencyById: builder.query<Currency, { id: number; format?: "json" | "xlsx" }>({
            query: ({ id, format }) => ({
                url: `/pnl/currency/${id}/`,
                method: "GET",
                params: format ? { format } : undefined,
            }),
            providesTags: (res, err, arg) => [{ type: "PnlCurrency", id: arg.id }],
        }),

        createPnlCurrency: builder.mutation<Currency, CurrencyPayload>({
            query: (body) => {
                const formData = new FormData();
                formData.append("code", body.code);
                formData.append("name", body.name);
                formData.append("symbol", body.symbol);

                return {
                    url: "/pnl/currency/",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: [{ type: "PnlCurrency", id: "LIST" }],
        }),

        updatePnlCurrency: builder.mutation<Currency, { id: number; data: Partial<CurrencyPayload> }>({
            query: ({ id, data }) => {
                const formData = new FormData();
                if (data.code) formData.append("code", data.code);
                if (data.name) formData.append("name", data.name);
                if (data.symbol) formData.append("symbol", data.symbol);

                return {
                    url: `/pnl/currency/${id}/`,
                    method: "PATCH",
                    body: formData,
                };
            },
            invalidatesTags: (res, err, arg) => [
                { type: "PnlCurrency", id: "LIST" },
                { type: "PnlCurrency", id: arg.id },
            ],
        }),

        deletePnlCurrency: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `/pnl/currency/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (res, err, arg) => [
                { type: "PnlCurrency", id: "LIST" },
                { type: "PnlCurrency", id: arg.id },
            ],
        }),

        // =========================
        // PAYMENT METHOD ( CRUD )
        // =========================
        getPnlPaymentMethods: builder.query<
            PaymentMethodResponse,
            {
                page?: number;
                ordering?: "id" | "-id" | "name" | "-name";
                name?: string;
                format?: "json" | "xlsx";
            }
        >({
            query: (params) => ({
                url: "/pnl/payment-method/",
                method: "GET",
                params,
            }),
            providesTags: [{ type: "PnlPaymentMethod", id: "LIST" }],
        }),

        getPnlPaymentMethodById: builder.query<PaymentMethod, { id: number; format?: "json" | "xlsx" }>({
            query: ({ id, format }) => ({
                url: `/pnl/payment-method/${id}/`,
                method: "GET",
                params: format ? { format } : undefined,
            }),
            providesTags: (res, err, arg) => [{ type: "PnlPaymentMethod", id: arg.id }],
        }),

        createPnlPaymentMethod: builder.mutation<PaymentMethod, PaymentMethodPayload>({
            query: (body) => {
                const formData = new FormData();
                formData.append("name", body.name);

                return {
                    url: "/pnl/payment-method/",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: [{ type: "PnlPaymentMethod", id: "LIST" }],
        }),

        updatePnlPaymentMethod: builder.mutation<
            PaymentMethod,
            { id: number; data: Partial<PaymentMethodPayload> }
        >({
            query: ({ id, data }) => {
                const formData = new FormData();
                if (data.name) formData.append("name", data.name);

                return {
                    url: `/pnl/payment-method/${id}/`,
                    method: "PATCH",
                    body: formData,
                };
            },
            invalidatesTags: (res, err, arg) => [
                { type: "PnlPaymentMethod", id: "LIST" },
                { type: "PnlPaymentMethod", id: arg.id },
            ],
        }),

        deletePnlPaymentMethod: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `/pnl/payment-method/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (res, err, arg) => [
                { type: "PnlPaymentMethod", id: "LIST" },
                { type: "PnlPaymentMethod", id: arg.id },
            ],
        }),

        // =========================
        // SUBCATEGORY ( CRUD )
        // =========================
        getPnlSubCategories: builder.query<
            SubCategoryResponse,
            {
                page?: number;
                ordering?: "id" | "-id" | "name" | "-name";
                name?: string;
                category?: number;
                format?: "json" | "xlsx";
            }
        >({
            query: (params) => ({
                url: "/pnl/subcategory/",
                method: "GET",
                params,
            }),
            providesTags: [{ type: "PnlSubCategory", id: "LIST" }],
        }),

        getPnlSubCategoryById: builder.query<SubCategory, { id: number; format?: "json" | "xlsx" }>({
            query: ({ id, format }) => ({
                url: `/pnl/subcategory/${id}/`,
                method: "GET",
                params: format ? { format } : undefined,
            }),
            providesTags: (res, err, arg) => [{ type: "PnlSubCategory", id: arg.id }],
        }),

        createPnlSubCategory: builder.mutation<SubCategory, SubCategoryPayload>({
            query: (body) => {
                const formData = new FormData();
                formData.append("category_id", String(body.category_id));
                formData.append("name", body.name);

                return {
                    url: "/pnl/subcategory/",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: [{ type: "PnlSubCategory", id: "LIST" }],
        }),

        updatePnlSubCategory: builder.mutation<
            SubCategory,
            { id: number; data: Partial<SubCategoryPayload> }
        >({
            query: ({ id, data }) => {
                const formData = new FormData();
                if (data.category_id !== undefined) formData.append("category_id", String(data.category_id));
                if (data.name) formData.append("name", data.name);

                return {
                    url: `/pnl/subcategory/${id}/`,
                    method: "PATCH",
                    body: formData,
                };
            },
            invalidatesTags: (res, err, arg) => [
                { type: "PnlSubCategory", id: "LIST" },
                { type: "PnlSubCategory", id: arg.id },
            ],
        }),

        deletePnlSubCategory: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `/pnl/subcategory/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (res, err, arg) => [
                { type: "PnlSubCategory", id: "LIST" },
                { type: "PnlSubCategory", id: arg.id },
            ],
        }),

        // =========================
        // TRANSACTION ( CRUD )
        // =========================
        getPnlTransactions: builder.query<
            TransactionResponse,
            {
                page?: number;
                page_size?: number;

                ordering?: "amount" | "-amount" | "created_at" | "-created_at" | "updated_at" | "-updated_at";
                format?: "json" | "xlsx";

                type?: TransactionTypeEnum;
                category?: number;
                subcategory?: number;
                payment_method?: number;
                currency?: number;
                currency_code?: string;
                description?: string;

                school?: number

                amount_min?: string;
                amount_max?: string;

                created_at_after?: string;
                created_at_before?: string;
                updated_at_after?: string;
                updated_at_before?: string;
            }
        >({
            query: (params) => ({
                url: "/pnl/transaction/",
                method: "GET",
                params,
            }),
            providesTags: [{ type: "PnlTransaction", id: "LIST" }],
        }),

        getPnlTransactionById: builder.query<Transaction, { id: number; format?: "json" | "xlsx" }>({
            query: ({ id, format }) => ({
                url: `/pnl/transaction/${id}/`,
                method: "GET",
                params: format ? { format } : undefined,
            }),
            providesTags: (res, err, arg) => [{ type: "PnlTransaction", id: arg.id }],
        }),

        createPnlTransaction: builder.mutation<Transaction, TransactionPayload>({
            query: (body) => {
                const formData = new FormData();
                formData.append("category_id", String(body.category_id));
                if (body.subcategory_id !== undefined && body.subcategory_id !== null)
                    formData.append("subcategory_id", String(body.subcategory_id));
                formData.append("payment_method_id", String(body.payment_method_id));
                formData.append("school_id", String(body.school_id));
                formData.append("currency_id", String(body.currency_id));
                formData.append("amount", body.amount);
                formData.append("type", body.type);
                if (body.description) formData.append("description", body.description);

                return {
                    url: "/pnl/transaction/",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: [{ type: "PnlTransaction", id: "LIST" }],
        }),

        updatePnlTransaction: builder.mutation<
            Transaction,
            { id: number; data: Partial<TransactionPayload> }
        >({
            query: ({ id, data }) => {
                const formData = new FormData();

                if (data.category_id !== undefined) formData.append("category_id", String(data.category_id));

                if (data.subcategory_id !== undefined) {
                    if (data.subcategory_id === null) formData.append("subcategory_id", "");
                    else formData.append("subcategory_id", String(data.subcategory_id));
                }

                if (data.payment_method_id !== undefined)
                    formData.append("payment_method_id", String(data.payment_method_id));

                if (data.school_id !== undefined) formData.append("school_id", String(data.school_id));

                if (data.currency_id !== undefined) formData.append("currency_id", String(data.currency_id));

                if (data.amount !== undefined) formData.append("amount", String(data.amount));
                if (data.type !== undefined) formData.append("type", data.type);

                if (data.description !== undefined) {
                    if (data.description === null) formData.append("description", "");
                    else if (data.description) formData.append("description", data.description);
                }

                return {
                    url: `/pnl/transaction/${id}/`,
                    method: "PATCH",
                    body: formData,
                };
            },
            invalidatesTags: (res, err, arg) => [
                { type: "PnlTransaction", id: "LIST" },
                { type: "PnlTransaction", id: arg.id },
            ],
        }),

        deletePnlTransaction: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `/pnl/transaction/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (res, err, arg) => [
                { type: "PnlTransaction", id: "LIST" },
                { type: "PnlTransaction", id: arg.id },
            ],
        }),

        // =========================
        // PNL SCHOOL BALANCE
        // =========================

        getPnlCompanyBalance: builder.query<
            CompanyBalanceResponse,
            {
                page?: number;
                currency?: number;
                balance_min?: string;
                balance_max?: string;
                ordering?: string;
            }
        >({
            query: (params) => ({
                url: "/pnl/balance/company/",
                method: "GET",
                params,
            }),
            providesTags: [{ type: "PnlCompanyBalance", id: "LIST" }],
        }),

        getPnlCompanyBalanceById: builder.query<CompanyBalance, { id: number }>({
            query: ({ id }) => ({
                url: `/pnl/balance/company/${id}/`,
                method: "GET",
            }),
            providesTags: (res, err, arg) => [{ type: "PnlCompanyBalance", id: arg.id }],
        }),

        // =========================
        // PNL COMPANY BALANCE
        // =========================

        getPnlSchoolBalance: builder.query<
            SchoolBalanceResponse,
            {
                page?: number;
                currency?: number;
                balance_min?: string;
                balance_max?: string;
                ordering?: string;
                school?: number;
            }
        >({
            query: (params) => ({
                url: "/pnl/balance/school/",
                method: "GET",
                params,
            }),
            providesTags: [{ type: "PnlSchoolBalance", id: "LIST" }],
        }),

        getPnlSchoolBalanceById: builder.query<SchoolBalance, { id: number }>({
            query: ({ id }) => ({
                url: `/pnl/balance/school/${id}/`,
                method: "GET",
            }),
            providesTags: (res, err, arg) => [{ type: "PnlSchoolBalance", id: arg.id }],
        }),
    }),
    overrideExisting: false,
});

export const {
    // CATEGORY
    useGetPnlCategoriesQuery,
    useLazyGetPnlCategoryByIdQuery,
    useGetPnlCategoryByIdQuery,
    useCreatePnlCategoryMutation,
    useUpdatePnlCategoryMutation,
    useDeletePnlCategoryMutation,

    // CURRENCY
    useGetPnlCurrenciesQuery,
    useLazyGetPnlCurrencyByIdQuery,
    useGetPnlCurrencyByIdQuery,
    useCreatePnlCurrencyMutation,
    useUpdatePnlCurrencyMutation,
    useDeletePnlCurrencyMutation,

    // PAYMENT METHOD
    useGetPnlPaymentMethodsQuery,
    useLazyGetPnlPaymentMethodByIdQuery,
    useGetPnlPaymentMethodByIdQuery,
    useCreatePnlPaymentMethodMutation,
    useUpdatePnlPaymentMethodMutation,
    useDeletePnlPaymentMethodMutation,

    // SUBCATEGORY
    useGetPnlSubCategoriesQuery,
    useLazyGetPnlSubCategoryByIdQuery,
    useGetPnlSubCategoryByIdQuery,
    useCreatePnlSubCategoryMutation,
    useUpdatePnlSubCategoryMutation,
    useDeletePnlSubCategoryMutation,

    // TRANSACTION
    useGetPnlTransactionsQuery,
    useLazyGetPnlTransactionsQuery,
    useLazyGetPnlTransactionByIdQuery,
    useCreatePnlTransactionMutation,
    useUpdatePnlTransactionMutation,
    useDeletePnlTransactionMutation,

    // PNL BALANCE

    // SCHOOL

    useGetPnlCompanyBalanceQuery,
    useLazyGetPnlCompanyBalanceQuery,
    useGetPnlCompanyBalanceByIdQuery,

    // COMPANY

    useGetPnlSchoolBalanceQuery,
    useLazyGetPnlSchoolBalanceQuery,
    useGetPnlSchoolBalanceByIdQuery,

} = pnlApi;
