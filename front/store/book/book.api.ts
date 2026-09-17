import {baseApi, PaginatedResponse} from "@/store/baseApi";
import {toFormData} from "@/libs/formdata";
import {Book, BookPayload} from "@/store/book/book.type";

export const bookApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getBooks: builder.query<
            PaginatedResponse<Book>,
            {
                page?: number;
                search?: string;
                ordering?: string;
                currency?: number;
                amount_min?: number;
                amount_max?: number;
                price_min?: string;
                price_max?: string;
            }
        >({
            query: (params) => ({
                url: "/books/books/",
                method: "GET",
                params: {
                    page_size: 50,
                    ...params,
                },
            }),
            providesTags: ["Book"],
        }),

        getBookById: builder.query<Book, number>({
            query: (id) => ({
                url: `/books/books/${id}/`,
                method: "GET",
            }),
            providesTags: ["Book"],
        }),

        createBook: builder.mutation<Book, BookPayload>({
            query: (data) => ({
                url: "/books/books/",
                method: "POST",
                body: toFormData(data),
            }),
            invalidatesTags: ["Book"],
        }),

        updateBook: builder.mutation<Book, {id: number; data: BookPayload}>({
            query: ({id, data}) => ({
                url: `/books/books/${id}/`,
                method: "PUT",
                body: toFormData(data),
            }),
            invalidatesTags: ["Book"],
        }),

        patchBook: builder.mutation<Book, {id: number; data: Partial<BookPayload>}>({
            query: ({id, data}) => ({
                url: `/books/books/${id}/`,
                method: "PATCH",
                body: toFormData(data),
            }),
            invalidatesTags: ["Book"],
        }),

        deleteBook: builder.mutation<void, number>({
            query: (id) => ({
                url: `/books/books/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["Book"],
        }),
    }),
});

export const {
    useGetBooksQuery,
    useGetBookByIdQuery,
    useCreateBookMutation,
    useUpdateBookMutation,
    usePatchBookMutation,
    useDeleteBookMutation,
} = bookApi;