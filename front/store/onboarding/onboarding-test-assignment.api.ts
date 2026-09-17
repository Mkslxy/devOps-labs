import { baseApi, PaginatedResponse } from "@/store/baseApi";
import { toFormData } from "@/libs/formdata";
import {
    OnboardingTestAssignment,
    OnboardingTestAssignmentPayload
} from "@/store/onboarding/onboarding-test-assignment.type";

export const onboardingTestAssignmentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getOnboardingTestAssignments: builder.query<
            PaginatedResponse<OnboardingTestAssignment>,
            {
                page?: number;
                page_size?: number;
                search?: string;
                test?: number;
                actual_version?: number;
                created_by?: number;
                created_after?: string;
                created_before?: string;
                starting_after?: string;
                starting_before?: string;
                closing_after?: string;
                closing_before?: string;
                ordering?: string;
            }
        >({
            query: (params) => ({
                url: "/test-management/onboarding/test-assignments/",
                method: "GET",
                params: {
                    page_size: 50,
                    ...(params || {}),
                },
            }),
            providesTags: ["OnboardingTestAssignment"],
        }),

        getOnboardingTestAssignmentById: builder.query<
            OnboardingTestAssignment,
            number
        >({
            query: (id) => ({
                url: `/test-management/onboarding/test-assignments/${id}/`,
                method: "GET",
            }),
            providesTags: ["OnboardingTestAssignment"],
        }),

        createOnboardingTestAssignment: builder.mutation<
            OnboardingTestAssignment,
            OnboardingTestAssignmentPayload
        >({
            query: (data) => ({
                url: "/test-management/onboarding/test-assignments/",
                method: "POST",
                body: toFormData(data),
            }),
            invalidatesTags: ["OnboardingTestAssignment"],
        }),

        updateOnboardingTestAssignment: builder.mutation<
            OnboardingTestAssignment,
            {
                id: number;
                data: OnboardingTestAssignmentPayload;
            }
        >({
            query: ({ id, data }) => ({
                url: `/test-management/onboarding/test-assignments/${id}/`,
                method: "PUT",
                body: toFormData(data),
            }),
            invalidatesTags: ["OnboardingTestAssignment"],
        }),

        patchOnboardingTestAssignment: builder.mutation<
            OnboardingTestAssignment,
            {
                id: number;
                data: Partial<OnboardingTestAssignmentPayload>;
            }
        >({
            query: ({ id, data }) => ({
                url: `/test-management/onboarding/test-assignments/${id}/`,
                method: "PATCH",
                body: toFormData(data),
            }),
            invalidatesTags: ["OnboardingTestAssignment"],
        }),

        deleteOnboardingTestAssignment: builder.mutation<void, number>({
            query: (id) => ({
                url: `/test-management/onboarding/test-assignments/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["OnboardingTestAssignment"],
        }),
    }),
});

export const {
    useGetOnboardingTestAssignmentsQuery,
    useGetOnboardingTestAssignmentByIdQuery,
    useCreateOnboardingTestAssignmentMutation,
    useUpdateOnboardingTestAssignmentMutation,
    usePatchOnboardingTestAssignmentMutation,
    useDeleteOnboardingTestAssignmentMutation,
} = onboardingTestAssignmentApi;