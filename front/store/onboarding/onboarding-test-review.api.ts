import { baseApi } from "@/store/baseApi";
import { toFormData } from "@/libs/formdata";
import { OnboardingTestAnswerReviewResponse } from "./onboarding-test-review.type";
import {OnboardingTestAnswerReviewPayload} from "@/store/onboarding/onboarding-test-review.type";
export const onboardingStudentResultApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        updateOnboardingTestAnswerReview: builder.mutation<
            OnboardingTestAnswerReviewResponse,
            {
                id: number;
                data: OnboardingTestAnswerReviewPayload;
            }
        >({
            query: ({ id, data }) => ({
                url: `/test-management/onboarding/test-answer-review/${id}/`,
                method: "PUT",
                body: toFormData(data),
            }),
            invalidatesTags: ["OnboardingStudentResult"],
        }),

        patchOnboardingTestAnswerReview: builder.mutation<
            OnboardingTestAnswerReviewResponse,
            {
                id: number;
                data: Partial<OnboardingTestAnswerReviewPayload>;
            }
        >({
            query: ({ id, data }) => ({
                url: `/test-management/onboarding/test-answer-review/${id}/`,
                method: "PATCH",
                body: toFormData(data),
            }),
            invalidatesTags: ["OnboardingStudentResult"],
        }),
    }),
});

export const {
    useUpdateOnboardingTestAnswerReviewMutation,
    usePatchOnboardingTestAnswerReviewMutation,
} = onboardingStudentResultApi;