import { baseApi, PaginatedResponse } from "@/store/baseApi";
import { toFormData } from "@/libs/formdata";
import {
    SubscriptionPlan,
    SubscriptionPlanPayload,
} from "@/store/subscription/subscription-plan.type";

export const subscriptionPlanApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSubscriptionPlans: builder.query<
            PaginatedResponse<SubscriptionPlan>,
            {
                page?: number;
                search?: string;
                course?: number;
                currency?: number;
                lesson_type?: number;
                is_active?: boolean;
                min_lessons?: number;
                max_lessons?: number;
                min_price?: number;
                max_price?: number;
                ordering?: string;
            }
        >({
            query: (params) => ({
                url: "/sub-plan/",
                method: "GET",
                params: {
                    page_size: 50,
                    ...params,
                },
            }),
            providesTags: ["SubscriptionPlan"],
        }),

        getSubscriptionPlanById: builder.query<SubscriptionPlan, number>({
            query: (id) => ({
                url: `/sub-plan/${id}/`,
                method: "GET",
            }),
            providesTags: ["SubscriptionPlan"],
        }),

        createSubscriptionPlan: builder.mutation<
            SubscriptionPlan,
            SubscriptionPlanPayload
        >({
            query: (data) => ({
                url: "/sub-plan/",
                method: "POST",
                body: toFormData(data),
            }),
            invalidatesTags: ["SubscriptionPlan"],
        }),

        updateSubscriptionPlan: builder.mutation<
            SubscriptionPlan,
            { id: number; data: SubscriptionPlanPayload }
        >({
            query: ({ id, data }) => ({
                url: `/sub-plan/${id}/`,
                method: "PUT",
                body: toFormData(data),
            }),
            invalidatesTags: ["SubscriptionPlan"],
        }),

        patchSubscriptionPlan: builder.mutation<
            SubscriptionPlan,
            { id: number; data: SubscriptionPlanPayload }
        >({
            query: ({ id, data }) => ({
                url: `/sub-plan/${id}/`,
                method: "PATCH",
                body: toFormData(data),
            }),
            invalidatesTags: ["SubscriptionPlan"],
        }),

        deleteSubscriptionPlan: builder.mutation<void, number>({
            query: (id) => ({
                url: `/sub-plan/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["SubscriptionPlan"],
        }),
    }),
});

export const {
    useGetSubscriptionPlansQuery,
    useGetSubscriptionPlanByIdQuery,
    useCreateSubscriptionPlanMutation,
    useUpdateSubscriptionPlanMutation,
    usePatchSubscriptionPlanMutation,
    useDeleteSubscriptionPlanMutation,
} = subscriptionPlanApi;