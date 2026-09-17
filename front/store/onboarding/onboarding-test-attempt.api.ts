import { baseApi } from "@/store/baseApi";
import {
    OnboardingTestAttempt,
    OnboardingTestAttemptCreatePayload,
    OnboardingTestAttemptCreateResponse,
    OnboardingTestAttemptFinishPayload,
    OnboardingTestAttemptFinishResponse,
    OnboardingTestAttemptReview,
} from "./onboarding-test-attempt.type";

export const onboardingTestAttemptApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createOnboardingTestAttempt: builder.mutation<
            OnboardingTestAttemptCreateResponse,
            OnboardingTestAttemptCreatePayload
        >({
            query: (data) => ({
                url: "/test-taking/onboarding/test-assignments/",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }),
            invalidatesTags: ["OnboardingTestAttempt"],
        }),

        getOnboardingTestAttemptById: builder.query<
            OnboardingTestAttempt,
            number
        >({
            query: (id) => ({
                url: `/test-taking/onboarding/test-assignments/${id}/`,
                method: "GET",
            }),
            providesTags: ["OnboardingTestAttempt"],
        }),

        finishOnboardingTestAttempt: builder.mutation<
            OnboardingTestAttemptFinishResponse,
            {
                id: number;
                data: OnboardingTestAttemptFinishPayload;
            }
        >({
            query: ({ id, data }) => ({
                url: `/test-taking/onboarding/test-assignments/${id}/finish/`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }),
            invalidatesTags: ["OnboardingTestAttempt"],
        }),

        getOnboardingTestAttemptReview: builder.query<
            OnboardingTestAttemptReview,
            number
        >({
            query: (id) => ({
                url: `/test-taking/onboarding/test-assignments/${id}/review/`,
                method: "GET",
            }),
            providesTags: ["OnboardingTestAttempt"],
        }),
    }),
});

export const {
    useCreateOnboardingTestAttemptMutation,
    useGetOnboardingTestAttemptByIdQuery,
    useFinishOnboardingTestAttemptMutation,
    useGetOnboardingTestAttemptReviewQuery,
} = onboardingTestAttemptApi;