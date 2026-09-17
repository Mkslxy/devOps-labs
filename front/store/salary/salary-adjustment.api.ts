import { baseApi, PaginatedResponse } from "@/store/baseApi";
import {
    SalaryAdjustment,
    SalaryAdjustmentPayload,
} from "./salary-adjustment.type";
import { toFormData } from "@/libs/formdata";

export const salaryAdjustmentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSalaryAdjustments: builder.query<
            PaginatedResponse<SalaryAdjustment>,
            {
                page?: number;
                search?: string;
                type?: string;
                user?: number;
                payout?: number;
                amount_min?: string;
                amount_max?: string;
                created_at_after?: string;
                created_at_before?: string;
                updated_at_after?: string;
                updated_at_before?: string;
                ordering?: string;
            }
        >({
            query: (params) => ({
                url: "/salary-adjustment/",
                params,
            }),
            providesTags: ["SalaryAdjustment"],
        }),

        getSalaryAdjustmentById: builder.query<SalaryAdjustment, number>({
            query: (id) => ({
                url: `/salary-adjustment/${id}/`,
            }),
            providesTags: ["SalaryAdjustment"],
        }),

        createSalaryAdjustment: builder.mutation<
            SalaryAdjustment,
            SalaryAdjustmentPayload
        >({
            query: (body) => ({
                url: "/salary-adjustment/",
                method: "POST",
                body: toFormData(body),
            }),
            invalidatesTags: ["SalaryAdjustment"],
        }),

        updateSalaryAdjustment: builder.mutation<
            SalaryAdjustment,
            { id: number; body: SalaryAdjustmentPayload }
        >({
            query: ({ id, body }) => ({
                url: `/salary-adjustment/${id}/`,
                method: "PUT",
                body: toFormData(body),
            }),
            invalidatesTags: ["SalaryAdjustment"],
        }),

        patchSalaryAdjustment: builder.mutation<
            SalaryAdjustment,
            { id: number; body: Partial<SalaryAdjustmentPayload> }
        >({
            query: ({ id, body }) => ({
                url: `/salary-adjustment/${id}/`,
                method: "PATCH",
                body: toFormData(body),
            }),
            invalidatesTags: ["SalaryAdjustment"],
        }),

        deleteSalaryAdjustment: builder.mutation<void, number>({
            query: (id) => ({
                url: `/salary-adjustment/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["SalaryAdjustment"],
        }),
    }),
});

export const {
    useGetSalaryAdjustmentsQuery,
    useGetSalaryAdjustmentByIdQuery,
    useCreateSalaryAdjustmentMutation,
    useUpdateSalaryAdjustmentMutation,
    usePatchSalaryAdjustmentMutation,
    useDeleteSalaryAdjustmentMutation,
} = salaryAdjustmentApi;