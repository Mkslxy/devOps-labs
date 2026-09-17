import { toFormData } from "@/libs/formdata";
import { baseApi, PaginatedResponse } from "@/store/baseApi";
import {
    ReportSubmission, ReportSubmissionEnum,
    ReportSubmissionPayload,
    ReportSubmissionReviewPayload,
} from "@/store/reports/report-submission.type";

export const reportSubmissionApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getReportSubmissions: builder.query<
            PaginatedResponse<ReportSubmission>,
            {
                page?: number;
                page_size?: number;
                created_by_role_slug?: string;
                created_by?: number;
                request?: number;
                request__assigned_to?: number;
                reviewed_at_after?: string;
                reviewed_at_before?: string;
                reviewed_by?: number;
                status?: ReportSubmissionEnum;
                template?: number;
                ordering?: string;
            }
        >({
            query: (params) => ({
                url: "reports/submission/",
                method: "GET",
                params,
            }),
            providesTags: ["Report"],
        }),

        getReportSubmissionById: builder.query<ReportSubmission, number>({
            query: (id) => ({
                url: `reports/submission/${id}/`,
                method: "GET",
            }),
            providesTags: ["Report"],
        }),

        createReportSubmission: builder.mutation<
            ReportSubmission,
            ReportSubmissionPayload
        >({
            query: (data) => ({
                url: "reports/submission/",
                method: "POST",
                body: toFormData(data, {
                    map: {
                        answers: (value) => JSON.stringify(value),
                    },
                }),
            }),
            invalidatesTags: ["Report"],
        }),

        updateReportSubmission: builder.mutation<
            ReportSubmission,
            { id: number; data: ReportSubmissionPayload }
        >({
            query: ({ id, data }) => ({
                url: `reports/submission/${id}/`,
                method: "PUT",
                body: toFormData(data, {
                    map: {
                        answers: (value) => JSON.stringify(value),
                    },
                }),
            }),
            invalidatesTags: ["Report"],
        }),

        patchReportSubmission: builder.mutation<
            ReportSubmission,
            { id: number; data: Partial<ReportSubmissionPayload> }
        >({
            query: ({ id, data }) => ({
                url: `reports/submission/${id}/`,
                method: "PATCH",
                body: toFormData(data, {
                    map: {
                        answers: (value) => JSON.stringify(value),
                    },
                }),
            }),
            invalidatesTags: ["Report"],
        }),

        deleteReportSubmission: builder.mutation<void, number>({
            query: (id) => ({
                url: `reports/submission/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["Report"],
        }),

        reviewReportSubmission: builder.mutation<
            ReportSubmissionReviewPayload,
            { id: number; data: ReportSubmissionReviewPayload }
        >({
            query: ({ id, data }) => ({
                url: `reports/submission/${id}/review/`,
                method: "POST",
                body: toFormData(data),
            }),
            invalidatesTags: ["Report"],
        }),
    }),
});

export const {
    useGetReportSubmissionsQuery,
    useGetReportSubmissionByIdQuery,
    useCreateReportSubmissionMutation,
    useUpdateReportSubmissionMutation,
    usePatchReportSubmissionMutation,
    useDeleteReportSubmissionMutation,
    useReviewReportSubmissionMutation,
} = reportSubmissionApi;