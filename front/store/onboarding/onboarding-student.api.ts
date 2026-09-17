import { baseApi, PaginatedResponse } from "@/store/baseApi";
import {
    OnboardingStudentResult,
    OnboardingStudentResultDetail,
    OnboardingStudentResultStatusEnum
} from "@/store/onboarding/onboarding-student.type";

export const onboardingStudentResultApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getOnboardingStudentResults: builder.query<
            PaginatedResponse<OnboardingStudentResult>,
            {
                page?: number;
                assignment?: number;
                student?: number;
                test_version?: number;
                status?: OnboardingStudentResultStatusEnum;
                is_passed?: boolean;
                min_grade?: number;
                max_grade?: number;
                ordering?: string;
            }
        >({
            query: (params) => ({
                url: "/test-management/onboarding/student-results/",
                method: "GET",
                params: {
                    page_size: 50,
                    ...(params || {}),
                },
            }),
            providesTags: ["OnboardingStudentResult"],
        }),

        getOnboardingStudentResultById: builder.query<
            OnboardingStudentResultDetail,
            number
        >({
            query: (id) => ({
                url: `/test-management/onboarding/student-results/${id}/`,
                method: "GET",
            }),
            providesTags: ["OnboardingStudentResult"],
        }),
    }),
});

export const {
    useGetOnboardingStudentResultsQuery,
    useGetOnboardingStudentResultByIdQuery,
} = onboardingStudentResultApi;