import { baseApi } from "@/store/baseApi";
import type {
    Question,
    QuestionPayload,
    QuestionResponse,
    TeacherAttemptListResponse,
    StudentResultDetail,
    TestAnswerReviewPayload,
    TestAnswerReviewResponse,
    TestAssignment,
    TestAssignmentPayload,
    TestAssignmentResponse,
    TestVersionDetail,
    TestVersionListResponse,
    TestVersionQuestionIdsPayload,
    TestVersionUpdatePayload,
    TestManagement,
    TestManagementResponse,
    TestCreatePayload,
    StartAttemptPayload,
    StartAttemptResponse,
    TestTakingAttemptDetail,
    FinishAttemptPayload,
    FinishAttemptResponse,
    TestTakingReviewResponse,
    TestTakingTestsResponse,
    TestTakingTestDetail,
    QuestionsListParams,
    StudentResultsListParams,
    TestAssignmentsListParams,
    TestVersionsListParams, TestsListParams, TakingTestsListParams,
} from "./test-management.type";


export const testManagementApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getQuestions: builder.query<QuestionResponse, QuestionsListParams | undefined>({
            query: (params) => ({
                url: "test-management/questions/",
                ...(params ? { params } : {}),
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.results.map((q) => ({ type: "Question" as const, id: q.id })),
                        { type: "Question" as const, id: "LIST" },
                    ]
                    : [{ type: "Question" as const, id: "LIST" }],
        }),

        getQuestionById: builder.query<Question, number>({
            query: (id) => `test-management/questions/${id}/`,
            providesTags: (_res, _err, id) => [{ type: "Question" as const, id }],
        }),

        createQuestion: builder.mutation<Question, QuestionPayload>({
            query: (body) => ({
                url: "test-management/questions/",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Question" as const, id: "LIST" }],
        }),

        updateQuestion: builder.mutation<Question, { id: number; data: QuestionPayload }>({
            query: ({ id, data }) => ({
                url: `test-management/questions/${id}/`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "Question" as const, id: arg.id },
                { type: "Question" as const, id: "LIST" },
            ],
        }),

        patchQuestion: builder.mutation<
            Question,
            { id: number; data: Partial<QuestionPayload> }
        >({
            query: ({ id, data }) => ({
                url: `test-management/questions/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "Question" as const, id: arg.id },
                { type: "Question" as const, id: "LIST" },
            ],
        }),

        deleteQuestion: builder.mutation<void, number>({
            query: (id) => ({
                url: `test-management/questions/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "Question" as const, id: "LIST" }],
        }),

        getStudentResults: builder.query<TeacherAttemptListResponse, StudentResultsListParams | undefined>({
            query: (params) => ({
                url: "test-management/student-results/",
                ...(params ? { params } : {}),
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.results.map((a) => ({ type: "StudentResult" as const, id: a.id })),
                        { type: "StudentResult" as const, id: "LIST" },
                    ]
                    : [{ type: "StudentResult" as const, id: "LIST" }],
        }),

        getStudentResultById: builder.query<StudentResultDetail, number>({
            query: (id) => `test-management/student-results/${id}/`,
            providesTags: (_res, _err, id) => [{ type: "StudentResult" as const, id }],
        }),

        updateTestAnswerReview: builder.mutation<
            TestAnswerReviewResponse,
            { id: number; data: TestAnswerReviewPayload }
        >({
            query: ({ id, data }) => ({
                url: `test-management/test-answer-review/${id}/`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: [{ type: "StudentResult" as const, id: "LIST" }],
        }),

        patchTestAnswerReview: builder.mutation<
            TestAnswerReviewResponse,
            { id: number; data: Partial<TestAnswerReviewPayload> }
        >({
            query: ({ id, data }) => ({
                url: `test-management/test-answer-review/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: [{ type: "StudentResult" as const, id: "LIST" }],
        }),

        getTestAssignments: builder.query<TestAssignmentResponse, TestAssignmentsListParams | undefined>({
            query: (params) => ({
                url: "test-management/test-assignments/",
                ...(params ? { params } : {}),
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.results.map((a) => ({ type: "TestAssignment" as const, id: a.id })),
                        { type: "TestAssignment" as const, id: "LIST" },
                    ]
                    : [{ type: "TestAssignment" as const, id: "LIST" }],
        }),

        getTestAssignmentById: builder.query<TestAssignment, number>({
            query: (id) => `test-management/test-assignments/${id}/`,
            providesTags: (_res, _err, id) => [{ type: "TestAssignment" as const, id }],
        }),

        createTestAssignment: builder.mutation<TestAssignment, TestAssignmentPayload>({
            query: (body) => ({
                url: "test-management/test-assignments/",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "TestAssignment" as const, id: "LIST" }],
        }),

        updateTestAssignment: builder.mutation<
            TestAssignment,
            { id: number; data: TestAssignmentPayload }
        >({
            query: ({ id, data }) => ({
                url: `test-management/test-assignments/${id}/`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "TestAssignment" as const, id: arg.id },
                { type: "TestAssignment" as const, id: "LIST" },
            ],
        }),

        patchTestAssignment: builder.mutation<
            TestAssignment,
            { id: number; data: Partial<TestAssignmentPayload> }
        >({
            query: ({ id, data }) => ({
                url: `test-management/test-assignments/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "TestAssignment" as const, id: arg.id },
                { type: "TestAssignment" as const, id: "LIST" },
            ],
        }),

        deleteTestAssignment: builder.mutation<void, number>({
            query: (id) => ({
                url: `test-management/test-assignments/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "TestAssignment" as const, id: "LIST" }],
        }),

        getTestVersions: builder.query<TestVersionListResponse, TestVersionsListParams | undefined>({
            query: (params) => ({
                url: "test-management/test-versions/",
                ...(params ? { params } : {}),
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.results.map((v) => ({ type: "TestVersion" as const, id: v.id })),
                        { type: "TestVersion" as const, id: "LIST" },
                    ]
                    : [{ type: "TestVersion" as const, id: "LIST" }],
        }),

        getTestVersionById: builder.query<TestVersionDetail, number>({
            query: (id) => `test-management/test-versions/${id}/`,
            providesTags: (_res, _err, id) => [{ type: "TestVersion" as const, id }],
        }),

        updateTestVersion: builder.mutation<
            TestVersionDetail,
            { id: number; data: TestVersionUpdatePayload }
        >({
            query: ({ id, data }) => ({
                url: `test-management/test-versions/${id}/`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [{ type: "TestVersion" as const, id: arg.id }],
        }),

        patchTestVersion: builder.mutation<
            TestVersionDetail,
            { id: number; data: Partial<TestVersionUpdatePayload> }
        >({
            query: ({ id, data }) => ({
                url: `test-management/test-versions/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "TestVersion" as const, id: arg.id },
                { type: "TestVersion" as const, id: "LIST" },
                { type: "Test" as const, id: "LIST" },
            ],
        }),

        deleteTestVersion: builder.mutation<void, number>({
            query: (id) => ({
                url: `test-management/test-versions/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "TestVersion" as const, id: "LIST" }],
        }),

        addQuestionsToVersion: builder.mutation<
            TestVersionDetail,
            { id: number; data: TestVersionQuestionIdsPayload }
        >({
            query: ({ id, data }) => ({
                url: `test-management/test-versions/${id}/add-questions/`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "TestVersion" as const, id: arg.id },
                { type: "TestVersion" as const, id: "LIST" },
                { type: "Test" as const, id: "LIST" },
            ],}),

        removeQuestionsFromVersion: builder.mutation<
            TestVersionDetail,
            { id: number; data: TestVersionQuestionIdsPayload }
        >({
            query: ({ id, data }) => ({
                url: `test-management/test-versions/${id}/remove-questions/`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "TestVersion" as const, id: arg.id },
                { type: "TestVersion" as const, id: "LIST" },
                { type: "Test" as const, id: "LIST" },
            ],
        }),

        getTestById: builder.query<TestManagement, number>({
            query: (id) => `test-management/tests/${id}/`,
            providesTags: (_res, _err, id) => [{ type: "Test" as const, id }],
        }),

        getTests: builder.query<TestManagementResponse, TestsListParams | undefined>({
            query: (params) => ({
                url: "test-management/tests/",
                ...(params ? { params } : {}),
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.results.map((t) => ({ type: "Test" as const, id: t.id })),
                        { type: "Test" as const, id: "LIST" },
                    ]
                    : [{ type: "Test" as const, id: "LIST" }],
        }),

        createTest: builder.mutation<TestManagement, TestCreatePayload>({
            query: (body) => ({
                url: "test-management/tests/",
                method: "POST",
                body,
            }),
            invalidatesTags: (res) => [
                { type: "Test" as const, id: "LIST" },
                { type: "TestVersion" as const, id: "LIST" },
                ...(res?.id ? [{ type: "Test" as const, id: res.id }] : []),
            ],
        }),

        deleteTest: builder.mutation<void, number>({
            query: (id) => ({
                url: `test-management/tests/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, id) => [
                { type: "Test" as const, id: "LIST" },
                { type: "Test" as const, id },
                { type: "TestVersion" as const, id: "LIST" },
            ],
        }),

        updateTest: builder.mutation<TestManagement, { id: number; data: TestCreatePayload }>({
            query: ({ id, data }) => ({
                url: `test-management/tests/${id}/`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "Test" as const, id: arg.id },
                { type: "Test" as const, id: "LIST" },
            ],
        }),

        patchTest: builder.mutation<TestManagement, { id: number; data: Partial<TestCreatePayload> }>({
            query: ({ id, data }) => ({
                url: `test-management/tests/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "Test" as const, id: arg.id },
                { type: "Test" as const, id: "LIST" },
                { type: "TestAssignment" as const, id: "LIST" },
            ],
        }),

        createTestVersion: builder.mutation<TestVersionDetail, number>({
            query: (testId) => ({
                url: `test-management/tests/${testId}/create-version/`,
                method: "POST",
            }),
            invalidatesTags: (_res, _err, testId) => [
                { type: "Test" as const, id: testId },
                { type: "Test" as const, id: "LIST" },
                { type: "TestVersion" as const, id: "LIST" },
            ],
        }),

        startAttempt: builder.mutation<StartAttemptResponse, StartAttemptPayload>({
            query: (body) => ({
                url: "test-taking/test-assignments/",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "StudentResult" as const, id: "LIST" }],
        }),

        getAttemptById: builder.query<TestTakingAttemptDetail, number>({
            query: (id) => `test-taking/test-assignments/${id}/`,
            providesTags: (_res, _err, id) => [{ type: "Attempt" as const, id }],
        }),

        finishAttempt: builder.mutation<FinishAttemptResponse, { id: number; data: FinishAttemptPayload }>({
            query: ({ id, data }) => ({
                url: `test-taking/test-assignments/${id}/finish/`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (res, _err, arg) => {
                const tags: Array<{ type: any; id: any }> = [
                    { type: "Attempt" as const, id: arg.id },
                    { type: "AttemptReview" as const, id: arg.id },
                    { type: "StudentResult" as const, id: "LIST" },
                    { type: "TakingTest" as const, id: "LIST" },
                ];

                const takingTestId = (res as any)?.test_id ?? (res as any)?.test?.id ?? null;
                if (typeof takingTestId === "number") {
                    tags.push({ type: "TakingTest" as const, id: takingTestId });
                }

                tags.push({ type: "Stats" as const, id: "STUDENT_ME" });

                const groupId = (res as any)?.group_id ?? (res as any)?.group?.id ?? null;
                if (typeof groupId === "number") {
                    tags.push({ type: "Stats" as const, id: `STUDENT_ME_GROUP_${groupId}` });
                }

                return tags;
            },
        }),

        getAttemptReview: builder.query<TestTakingReviewResponse, number>({
            query: (id) => `test-taking/test-assignments/${id}/review/`,
            providesTags: (_res, _err, id) => [{ type: "AttemptReview" as const, id }],
        }),

        getTakingTests: builder.query<TestTakingTestsResponse, TakingTestsListParams | undefined>({
            query: (params) => ({
                url: "test-taking/tests/",
                ...(params ? { params } : {}),
            }),
            providesTags: [{ type: "TakingTest" as const, id: "LIST" }],
        }),

        getTakingTestById: builder.query<TestTakingTestDetail, number>({
            query: (id) => `test-taking/tests/${id}/`,
            providesTags: (_res, _err, id) => [{ type: "TakingTest" as const, id }],
        }),
    }),
    overrideExisting: false,
});

export const {
    // Questions
    useGetQuestionsQuery,
    useGetQuestionByIdQuery,
    useCreateQuestionMutation,
    useUpdateQuestionMutation,
    usePatchQuestionMutation,
    useDeleteQuestionMutation,

    // Student results
    useGetStudentResultsQuery,
    useGetStudentResultByIdQuery,

    // Review
    useUpdateTestAnswerReviewMutation,
    usePatchTestAnswerReviewMutation,

    // Assignments
    useGetTestAssignmentsQuery,
    useGetTestAssignmentByIdQuery,
    useCreateTestAssignmentMutation,
    useUpdateTestAssignmentMutation,
    usePatchTestAssignmentMutation,
    useDeleteTestAssignmentMutation,

    // Versions
    useGetTestVersionsQuery,
    useGetTestVersionByIdQuery,
    useUpdateTestVersionMutation,
    usePatchTestVersionMutation,
    useDeleteTestVersionMutation,
    useAddQuestionsToVersionMutation,
    useRemoveQuestionsFromVersionMutation,

    // Tests
    useGetTestsQuery,
    useGetTestByIdQuery,
    useCreateTestMutation,
    useUpdateTestMutation,
    usePatchTestMutation,
    useDeleteTestMutation,
    useCreateTestVersionMutation,

    // Test Taking
    useStartAttemptMutation,
    useGetAttemptByIdQuery,
    useFinishAttemptMutation,
    useGetAttemptReviewQuery,

    useGetTakingTestsQuery,
    useGetTakingTestByIdQuery,
} = testManagementApi;
