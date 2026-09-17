import {
    Homework,
    HomeworkResponse,
    HomeWorkSubmission,
    HomeWorkSubmissionPayload,
    HomeWorkSubmissionResponse, HomeWorkSubmissionReview,
    HomeWorkSubmissionReviewResponse
} from "@/store/homework/homework.type";
import {baseApi} from "@/store/baseApi";

export const homeworkApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getHomeWork: builder.query<
            HomeworkResponse,
            { created_at_after?: string; created_at_before?: string; deadline_after?: string;
              deadline_before?: string; group?: number; lesson?: number; ordering?: string;
              page?: number; page_size?: number; student?: number;
            }
        >({
            query: (params) => ({
                url: "/homework/",
                params,
            }),
            providesTags: [
                { type: "HomeWork", id: "LIST" }
            ]
        }),

        getHomeWorkById: builder.query<Homework, number>({
            query: (id) => ({
                url: `/homework/${id}/`,
            }),
            providesTags: (_r, _e, id) => [{ type: "HomeWork", id }],
        }),

        createHomeWork: builder.mutation<Homework, FormData>({
            query: (body) => ({
                url: "/homework/",
                method: "POST",
                body,
            }),
            invalidatesTags: ["HomeWork"],
        }),

        updateHomeWork: builder.mutation<Homework, { id: number; data: FormData }>({
            query: ({ id, data }) => ({
                url: `/homework/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_r, _e, { id }) => [
                { type: "HomeWork", id },
                { type: "HomeWork", id: "LIST" },
            ],
        }),

        deleteHomeWork: builder.mutation<void, number>({
            query: (id) => ({
                url: `/homework/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, id) => [
                { type: "HomeWork", id },
                { type: "HomeWork", id: "LIST" },
            ],
        }),
        getHomeWorkSubmission: builder.query<
            HomeWorkSubmissionResponse,
            { created_at_after?: string; created_at_before?: string; deadline_after?: string;
                deadline_before?: string; group?: number; lesson?: number; ordering?: string;
                page?: number; page_size?: number; student?: number;
            }
        >({
            query: (params) => ({
                url: "/homework-submission/",
                params,
            }),
            providesTags: [
                { type: "HomeWorkSubmission", id: "LIST" }
            ]
        }),
        createHomeWorkSubmission: builder.mutation<HomeWorkSubmission, FormData>({
            query: (body) => ({
                url: "/homework-submission/",
                method: "POST",
                body,
            }),
            invalidatesTags: ["HomeWorkSubmission"],
        }),

        getHomeWorkSubmissionById: builder.query<HomeWorkSubmission, number>({
            query: (id) => ({ url: `/homework-submission/${id}/` }),
            providesTags: (_r, _e, id) => [{ type: "HomeWorkSubmission", id }],
        }),

        updateHomeWorkSubmission: builder.mutation<HomeWorkSubmission, { id: number; data: FormData }>({
            query: ({ id, data }) => ({
                url: `/homework-submission/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_r, _e, { id }) => [
                { type: "HomeWorkSubmission", id },
                { type: "HomeWorkSubmission", id: "LIST" },
            ],
        }),

        deleteHomeWorkSubmission: builder.mutation<void, number>({
            query: (id) => ({
                url: `/homework-submission/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, id) => [
                { type: "HomeWorkSubmission", id },
                { type: "HomeWorkSubmission", id: "LIST" },
            ],
        }),

        getHomeWorkSubmissionReview: builder.query<
            HomeWorkSubmissionReviewResponse,
            { created_at_after?: string; created_at_before?: string; homework?:number; group?: number; lesson?: number; ordering?: string;
                page?: number; page_size?: number; student?: number;
            }
        >({
            query: (params) => ({
                url: "/homework-submission-review/",
                params,
            }),
            providesTags: [
                { type: "HomeWorkSubmissionReview", id: "LIST" }
            ]
        }),

        getHomeWorkSubmissionReviewById: builder.query<HomeWorkSubmissionReview, number>({
            query: (id) => ({
                url: `/homework-submission-review/${id}/`,
            }),
            providesTags: (_r, _e, id) => [{ type: "HomeWork", id }],
        }),

        rateHomeWorkSubmissionReview: builder.mutation<
            HomeWorkSubmissionReview,
            { id: number; body: FormData }
        >({
            query: ({ id, body }) => ({
                url: `/homework-submission-review/${id}/rate/`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_r, _e, { id }) => [
                { type: "HomeWorkSubmissionReview", id },
                { type: "HomeWorkSubmissionReview", id: "LIST" },
            ],
        }),


        unRateHomeWorkSubmissionReview: builder.mutation<void, number>({
            query: (id) => ({
                url: `/homework-submission-review/${id}/unrate/`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, id) => [
                { type: "HomeWorkSubmissionReview", id },
                { type: "HomeWorkSubmissionReview", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useGetHomeWorkQuery,
    useGetHomeWorkByIdQuery,
    useCreateHomeWorkMutation,
    useUpdateHomeWorkMutation,
    useDeleteHomeWorkMutation,

    useGetHomeWorkSubmissionQuery,
    useCreateHomeWorkSubmissionMutation,
    useUpdateHomeWorkSubmissionMutation,
    useDeleteHomeWorkSubmissionMutation,
    useGetHomeWorkSubmissionByIdQuery,

    useGetHomeWorkSubmissionReviewQuery,
    useGetHomeWorkSubmissionReviewByIdQuery,
    useRateHomeWorkSubmissionReviewMutation,
    useUnRateHomeWorkSubmissionReviewMutation,
} = homeworkApi;
