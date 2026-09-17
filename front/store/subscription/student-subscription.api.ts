import { baseApi, PaginatedResponse } from "@/store/baseApi";
import { toFormData } from "@/libs/formdata";
import {
    StudentSubscription,
    StudentSubscriptionPayload, StudentSubscriptionStatusEnum,
} from "@/store/subscription/student-subscription.type";

export const studentSubscriptionApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getStudentSubscriptions: builder.query<
            PaginatedResponse<StudentSubscription>,
            {
                page?: number;
                search?: string;
                student?: number;
                plan?: number;
                group?: number;
                course?: number;
                status?: StudentSubscriptionStatusEnum;
                min_lessons?: number;
                max_lessons?: number;
                start_date_after?: string;
                start_date_before?: string;
                end_date_after?: string;
                end_date_before?: string;
                ordering?: string;
            }
        >({
            query: (params) => ({
                url: "/student-sub/",
                method: "GET",
                params: {
                    page_size: 50,
                    ...(params || {}),
                },
            }),
            providesTags: ["StudentSubscription"],
        }),

        getStudentSubscriptionById: builder.query<StudentSubscription, number>({
            query: (id) => ({
                url: `/student-sub/${id}/`,
                method: "GET",
            }),
            providesTags: ["StudentSubscription"],
        }),

        createStudentSubscription: builder.mutation<
            StudentSubscription,
            StudentSubscriptionPayload
        >({
            query: (data) => ({
                url: "/student-sub/",
                method: "POST",
                body: toFormData(data),
            }),
            invalidatesTags: ["StudentSubscription"],
        }),

        updateStudentSubscription: builder.mutation<
            StudentSubscription,
            { id: number; data: StudentSubscriptionPayload }
        >({
            query: ({ id, data }) => ({
                url: `/student-sub/${id}/`,
                method: "PUT",
                body: toFormData(data),
            }),
            invalidatesTags: ["StudentSubscription"],
        }),

        patchStudentSubscription: builder.mutation<
            StudentSubscription,
            { id: number; data: StudentSubscriptionPayload }
        >({
            query: ({ id, data }) => ({
                url: `/student-sub/${id}/`,
                method: "PATCH",
                body: toFormData(data),
            }),
            invalidatesTags: ["StudentSubscription"],
        }),

        deleteStudentSubscription: builder.mutation<void, number>({
            query: (id) => ({
                url: `/student-sub/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["StudentSubscription"],
        }),

        activateStudentSubscription: builder.mutation<
            StudentSubscription,
            { id: number; data?: StudentSubscriptionPayload }
        >({
            query: ({ id, data }) => ({
                url: `/student-sub/${id}/activate/`,
                method: "POST",
                body: data ? toFormData(data) : undefined,
            }),
            invalidatesTags: ["StudentSubscription"],
        }),
    }),
});

export const {
    useGetStudentSubscriptionsQuery,
    useGetStudentSubscriptionByIdQuery,
    useCreateStudentSubscriptionMutation,
    useUpdateStudentSubscriptionMutation,
    usePatchStudentSubscriptionMutation,
    useDeleteStudentSubscriptionMutation,
    useActivateStudentSubscriptionMutation,
} = studentSubscriptionApi;