import { toFormData } from "@/libs/formdata";
import {baseApi, PaginatedResponse} from "@/store/baseApi";
import {
    BookTransaction,
    BookTransactionPayload, BookTransactionTypeEnum,
} from "@/store/book/book-transaction.type";

export const bookTransactionApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getBookTransactions: builder.query<
            PaginatedResponse<BookTransaction>,
            {
                page?: number;
                amount_min?: number;
                amount_max?: number;
                price_min?: string;
                price_max?: string;
                currency?: number;
                created_by?: number;
                finance_transaction?: number;
                type?: BookTransactionTypeEnum;
                created_at_after?: string;
                created_at_before?: string;
                updated_at_after?: string;
                updated_at_before?: string;
                ordering?: string;
            }
        >({
            query: (params) => ({
                url: "/books/transactions/",
                method: "GET",
                params: {
                    page_size: 50,
                    ...params,
                },
            }),
            providesTags: ["BookTransaction"],
        }),

        getBookTransactionById: builder.query<BookTransaction, number>({
            query: (id) => ({
                url: `/books/transactions/${id}/`,
                method: "GET",
            }),
            providesTags: ["BookTransaction"],
        }),

        createBookTransaction: builder.mutation<BookTransaction, BookTransactionPayload>({
            query: (data) => ({
                url: "/books/transactions/",
                method: "POST",
                body: toFormData(data),
            }),
            invalidatesTags: ["BookTransaction", "Book"],
        }),

        updateBookTransaction: builder.mutation<BookTransaction, {id: number; data: BookTransactionPayload}>({
            query: ({id, data}) => ({
                url: `/books/transactions/${id}/`,
                method: "PUT",
                body: toFormData(data),
            }),
            invalidatesTags: ["BookTransaction", "Book"],
        }),

        patchBookTransaction: builder.mutation<BookTransaction, {id: number; data: Partial<BookTransactionPayload>}>({
            query: ({id, data}) => ({
                url: `/books/transactions/${id}/`,
                method: "PATCH",
                body: toFormData(data),
            }),
            invalidatesTags: ["BookTransaction", "Book"],
        }),

        deleteBookTransaction: builder.mutation<void, number>({
            query: (id) => ({
                url: `/books/transactions/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["BookTransaction", "Book"],
        }),
    }),
});

export const {
    useGetBookTransactionsQuery,
    useGetBookTransactionByIdQuery,
    useCreateBookTransactionMutation,
    useUpdateBookTransactionMutation,
    usePatchBookTransactionMutation,
    useDeleteBookTransactionMutation,
} = bookTransactionApi;