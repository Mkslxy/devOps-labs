import {baseApi, PaginatedResponse} from "@/store/baseApi";
import {
    PayoutRequest,
    PayoutRequestApprove, PayoutRequestCancel,
    PayoutRequestEnum,
    PayoutRequestPayload,
    PayoutRequestReject
} from "./payout-request.type";
import {toFormData} from "@/libs/formdata";

export const payoutRequestApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getPayoutRequests: builder.query<
            PaginatedResponse<PayoutRequest>,
            {
                page?: number;
                page_size?: number;
                user?: number;
                status?: PayoutRequestEnum;
                amount_min?: string;
                amount_max?: string;
                created_at_after?: string;
                created_at_before?: string;
                paid_at_after?: string;
                paid_at_before?: string;
                updated_at_after?: string;
                updated_at_before?: string;
                ordering?: string;
            }
        >({
            query: (params) => ({
                url: "payout-request/",
                method: "GET",
                params: {
                    page_size: 50,
                    ...params,
                },
            }),
            providesTags: ["SalaryPayoutRequest"],
        }),

        getPayoutRequestById: builder.query<PayoutRequest, number>({
            query: (id) => ({
                url: `payout-request/${id}/`,
                method: "GET",
            }),
            providesTags: ["SalaryPayoutRequest"],
        }),

        createPayoutRequest: builder.mutation<
            PayoutRequest,
            PayoutRequestPayload
        >({
            query: (body) => ({
                url: "payout-request/",
                method: "POST",
                body: toFormData(body),
            }),
            invalidatesTags: ["SalaryPayoutRequest"],
        }),

        approvePayoutRequest: builder.mutation<
            PayoutRequest,
            { id: number; body: PayoutRequestApprove }
        >({
            query: ({ id, body }) => ({
                url: `payout-request/${id}/approve/`,
                method: "POST",
                body: toFormData(body),
            }),
            invalidatesTags: ["SalaryPayoutRequest"],
        }),

        cancelPayoutRequest: builder.mutation<PayoutRequestCancel, number>({
            query: (id) => ({
                url: `payout-request/${id}/cancel/`,
                method: "POST",
            }),
            invalidatesTags: ["SalaryPayoutRequest"],
        }),

        rejectPayoutRequest: builder.mutation<
            PayoutRequest,
            { id: number; body: PayoutRequestReject }
        >({
            query: ({ id, body }) => ({
                url: `payout-request/${id}/reject/`,
                method: "POST",
                body: toFormData(body),
            }),
            invalidatesTags: ["SalaryPayoutRequest"],
        }),

        exportPayoutRequests: builder.query<Blob, void>({
            query: () => ({
                url: "payout-request/export/",
                method: "GET",
                responseHandler: (response) => response.blob(),
            }),
        }),
    }),
});

export const {
    useGetPayoutRequestsQuery,
    useGetPayoutRequestByIdQuery,
    useCreatePayoutRequestMutation,
    useApprovePayoutRequestMutation,
    useCancelPayoutRequestMutation,
    useRejectPayoutRequestMutation,
    useLazyExportPayoutRequestsQuery,
} = payoutRequestApi;