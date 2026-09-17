import {baseApi, PaginatedResponse} from "@/store/baseApi";
import {
    SalaryTariff,
    SalaryTariffPayload,
} from "./salary-tariff.type";
import {toFormData} from "@/libs/formdata";


export const salaryTariffApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSalaryTariffs: builder.query<
            PaginatedResponse<SalaryTariff>,
            {
                page?: number;
                page_size?: number;
                user?: number;
                currency?: number;
                base_rate_min?: string;
                base_rate_max?: string;
                amount_per_lesson_min?: string;
                amount_per_lesson_max?: string;
                retention_percent_min?: string;
                retention_percent_max?: string;
                accumulated_reserve_min?: string;
                accumulated_reserve_max?: string;
                ordering?: string;
            }
        >({
            query: (params) => ({
                url: "/salary-tariff/",
                params: {
                    page_size: 50,
                    ...(params || {}),
                },
            }),
            providesTags: ["SalaryTariff"],
        }),

        getSalaryTariffById: builder.query<SalaryTariff, number>({
            query: (id) => ({
                url: `/salary-tariff/${id}/`,
            }),
            providesTags: ["SalaryTariff"],
        }),

        createSalaryTariff: builder.mutation<
            SalaryTariff,
            SalaryTariffPayload
        >({
            query: (body) => ({
                url: "/salary-tariff/",
                method: "POST",
                body: toFormData(body),
            }),
            invalidatesTags: ["SalaryTariff"],
        }),

        updateSalaryTariff: builder.mutation<
            SalaryTariff,
            { id: number; body: SalaryTariffPayload }
        >({
            query: ({ id, body }) => ({
                url: `/salary-tariff/${id}/`,
                method: "PUT",
                body: toFormData(body),
            }),
            invalidatesTags: ["SalaryTariff"],
        }),

        patchSalaryTariff: builder.mutation<
            SalaryTariff,
            { id: number; body: Partial<SalaryTariffPayload> }
        >({
            query: ({ id, body }) => ({
                url: `/salary-tariff/${id}/`,
                method: "PATCH",
                body: toFormData(body),
            }),
            invalidatesTags: ["SalaryTariff"],
        }),

        deleteSalaryTariff: builder.mutation<void, number>({
            query: (id) => ({
                url: `/salary-tariff/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["SalaryTariff"],
        }),
    }),
});

export const {
    useGetSalaryTariffsQuery,
    useGetSalaryTariffByIdQuery,
    useCreateSalaryTariffMutation,
    useUpdateSalaryTariffMutation,
    usePatchSalaryTariffMutation,
    useDeleteSalaryTariffMutation,
} = salaryTariffApi;