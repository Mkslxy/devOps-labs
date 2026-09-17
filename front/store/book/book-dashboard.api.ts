import { baseApi } from "@/store/baseApi";
import {
    BookDashboardPayload,
    BookDashboardResponse,
} from "@/store/book/book-dashboard.type";
import { toFormData } from "@/libs/formdata";

export const bookDashboardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getBookDashboard: builder.mutation<
            BookDashboardResponse,
            BookDashboardPayload
        >({
            query: (data) => ({
                url: "/books/dashboard/",
                method: "POST",
                body: toFormData(data),
            }),
        }),
    }),
});

export const { useGetBookDashboardMutation } = bookDashboardApi;