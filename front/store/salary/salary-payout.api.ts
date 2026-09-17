import {baseApi, PaginatedResponse} from "@/store/baseApi";
import {toFormData} from "@/libs/formdata";

import {
    SalaryPayout,
    SalaryPayoutCancelResponse,
    SalaryPayoutMark,
    SalaryPayoutMarkResponse,
    SalaryPayoutPayload,
    SalaryPayoutStatusEnum,
    TeacherStats,
} from "@/store/salary/salary-payout.type";

export const salaryPayoutApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSalaryPayouts: builder.query<
            PaginatedResponse<SalaryPayout>,
            {
                page?: number;
                page_size?: number;

                ordering?: string;

                user?: number;
                status?: SalaryPayoutStatusEnum;

                period_start_after?: string;
                period_start_before?: string;
                period_end_after?: string;
                period_end_before?: string;

                paid_at_after?: string;
                paid_at_before?: string;

                base_rate_calculated_min?: string;
                base_rate_calculated_max?: string;

                lessons_amount_calculated_min?: string;
                lessons_amount_calculated_max?: string;

                retention_amount_min?: string;
                retention_amount_max?: string;

                bonuses_total_min?: string;
                bonuses_total_max?: string;

                penalties_total_min?: string;
                penalties_total_max?: string;

                total_payout_min?: string;
                total_payout_max?: string;
            }
        >({
            query: (params) => ({
                url: "/salary-payout/",
                method: "GET",
                params: {
                    page_size: 50,
                    ...params,
                },
            }),
            providesTags: ["SalaryPayout"],
        }),

        getSalaryPayoutById: builder.query<SalaryPayout, number>({
            query: (id) => ({
                url: `/salary-payout/${id}/`,
                method: "GET",
            }),
            providesTags: ["SalaryPayout"],
        }),

        createSalaryPayout: builder.mutation<SalaryPayout, SalaryPayoutPayload>({
            query: (body) => ({
                url: "/salary-payout/",
                method: "POST",
                body: toFormData(body),
            }),
            invalidatesTags: ["SalaryPayout", "Teacher"],
        }),

        cancelSalaryPayout: builder.mutation<SalaryPayoutCancelResponse, number>({
            query: (id) => ({
                url: `/salary-payout/${id}/cancel/`,
                method: "POST",
            }),
            invalidatesTags: ["SalaryPayout", "Teacher"],
        }),

        markSalaryPayoutAsPaid: builder.mutation<
            SalaryPayoutMarkResponse,
            { id: number; data: SalaryPayoutMark }
        >({
            query: ({id, data}) => ({
                url: `/salary-payout/${id}/mark-as-paid/`,
                method: "POST",
                body: toFormData(data),
            }),
            invalidatesTags: ["SalaryPayout"],
        }),

        exportSalaryPayouts: builder.query<Blob, void>({
            query: () => ({
                url: "/salary-payout/export/",
                method: "GET",
                responseHandler: (response) => response.blob(),
            }),
        }),

        getTeacherStats: builder.query<
            TeacherStats,
            {
                user_id: number;
                period_start?: string;
                period_end?: string;
            }
        >({
            query: (params) => ({
                url: "/teacher-stats/",
                method: "GET",
                params,
            }),
            providesTags: ["Teacher"],
        }),
    }),
});

export const {
    useGetSalaryPayoutsQuery,
    useGetSalaryPayoutByIdQuery,
    useCreateSalaryPayoutMutation,
    useCancelSalaryPayoutMutation,
    useMarkSalaryPayoutAsPaidMutation,
    useLazyExportSalaryPayoutsQuery,
    useGetTeacherStatsQuery,
} = salaryPayoutApi;