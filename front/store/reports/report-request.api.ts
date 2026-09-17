import { baseApi, PaginatedResponse } from "@/store/baseApi";
import {
    ReportRequest,
    ReportRequestEnum,
    ReportRequestPayload,
} from "@/store/reports/report-request.type";
import {toFormData} from "@/libs/formdata";

export const reportRequestApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getReportRequests: builder.query<
            PaginatedResponse<ReportRequest>,
            {
                page?: number;
                page_size?: number;
                assigned_to?: number;
                created_by?: number;
                deadline_after?: string;
                deadline_before?: string;
                ordering?: string;
                status?: ReportRequestEnum;
                template?: number;
            }
        >({
            query: (params) => ({
                url: "reports/request/",
                method: "GET",
                params,
            }),
            providesTags: ["Report"],
        }),

        getReportRequestById: builder.query<ReportRequest, number>({
            query: (id) => ({
                url: `reports/request/${id}/`,
                method: "GET",
            }),
            providesTags: ["Report"],
        }),

        createReportRequest: builder.mutation<
            ReportRequest,
            ReportRequestPayload
        >({
            query: (data) => ({
                url: "reports/request/",
                method: "POST",
                body: toFormData(data),
            }),
            invalidatesTags: ["Report"],
        }),

        updateReportRequest: builder.mutation<
            ReportRequest,
            { id: number; data: ReportRequestPayload }
        >({
            query: ({ id, data }) => ({
                url: `reports/request/${id}/`,
                method: "PUT",
                body: toFormData(data),
            }),
            invalidatesTags: ["Report"],
        }),

        patchReportRequest: builder.mutation<
            ReportRequest,
            { id: number; data: Partial<ReportRequestPayload> }
        >({
            query: ({ id, data }) => ({
                url: `reports/request/${id}/`,
                method: "PATCH",
                body: toFormData(data),
            }),
            invalidatesTags: ["Report"],
        }),

        deleteReportRequest: builder.mutation<void, number>({
            query: (id) => ({
                url: `reports/request/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["Report"],
        }),
    }),
});

export const {
    useGetReportRequestsQuery,
    useGetReportRequestByIdQuery,
    useCreateReportRequestMutation,
    useUpdateReportRequestMutation,
    usePatchReportRequestMutation,
    useDeleteReportRequestMutation,
} = reportRequestApi;