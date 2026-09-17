import { baseApi } from "@/store/baseApi";
import { toFormData } from "@/libs/formdata";
import {
    MagicFinancePayload,
    MagicFinanceResponse,
} from "@/store/magic-import/magic-finance.type";

export const magicFinanceApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getMagicFinanceAnalytics: builder.mutation<
            MagicFinanceResponse,
            MagicFinancePayload
        >({
            query: (data) => ({
                url: "/magic-import/finance-analytics/",
                method: "POST",
                body: toFormData(data),
            }),
        }),
    }),
});

export const { useGetMagicFinanceAnalyticsMutation } = magicFinanceApi;