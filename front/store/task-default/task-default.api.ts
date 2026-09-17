"use client";

import { baseApi } from "@/store/baseApi";
import type {
    Task,
    TaskPayload,
    TaskResponse,
    TaskSubmission,
    TaskSubmissionPayload,
    TaskSubmissionResponse,
    TaskReview,
    TaskReviewResponse, RateTaskSubmissionPayload,
} from "@/store/task-default/task-default.type";

export const taskApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // --------------------
        // Tasks
        // --------------------
        getTasks: builder.query<TaskResponse, {
            page?: number;
            page_size?: number;
            ordering?: "created_at" | "-created_at" | "updated_at" | "-updated_at";
            course_id?: number;
            topic_id?: number;
            created_by?: number;
        }>({
            query: (params) => ({
                url: "/task/",
                method: "GET",
                params,
            }),
            providesTags: (res) =>
                res?.results
                    ? [
                        { type: "Task" as const, id: "LIST" },
                        ...res.results.map((t) => ({ type: "Task" as const, id: t.id })),
                    ]
                    : [{ type: "Task" as const, id: "LIST" }],
        }),

        getTaskById: builder.query<Task, { id: number }>({
            query: ({ id }) => ({
                url: `/task/${id}/`,
                method: "GET",
            }),
            providesTags: (_res, _err, arg) => [{ type: "Task" as const, id: arg.id }],
        }),

        createTask: builder.mutation<Task, FormData>({
            query: (data) => ({
                url: "/task/",
                method: "POST",
                body: data,
            }),
            invalidatesTags: [{ type: "Task" as const, id: "LIST" }],
        }),

        updateTask: builder.mutation<Task, { id: number; data: FormData }>({
            query: ({ id, data }) => ({
                url: `/task/${id}/`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "Task" as const, id: arg.id },
                { type: "Task" as const, id: "LIST" },
            ],
        }),

        partialUpdateTask: builder.mutation<Task, { id: number; data: FormData }>({
            query: ({ id, data }) => ({
                url: `/task/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "Task" as const, id: arg.id },
                { type: "Task" as const, id: "LIST" },
            ],
        }),

        deleteTask: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `/task/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "Task" as const, id: arg.id },
                { type: "Task" as const, id: "LIST" },
            ],
        }),

        // --------------------
        // TaskSubmission (student only)
        // --------------------

        getTaskSubmissions: builder.query<TaskSubmissionResponse, {
            page?: number;
            page_size?: number;
            ordering?: "created_at" | "-created_at" | "updated_at" | "-updated_at";
            group_id?: number;
            student_id?: number;
            task_id?: number;
            is_rated?: boolean;
        }>({
            query: (params) => ({
                url: "/task-submission/",
                method: "GET",
                params,
            }),
            providesTags: (res) =>
                res?.results
                    ? [
                        { type: "TaskSubmission" as const, id: "LIST" },
                        ...res.results.map((s) => ({ type: "TaskSubmission" as const, id: s.id })),
                    ]
                    : [{ type: "TaskSubmission" as const, id: "LIST" }],
        }),

        getTaskSubmissionById: builder.query<TaskSubmission, { id: number }>({
            query: ({ id }) => ({
                url: `/task-submission/${id}/`,
                method: "GET",
            }),
            providesTags: (_res, _err, arg) => [{ type: "TaskSubmission" as const, id: arg.id }],
        }),

        createTaskSubmission: builder.mutation<TaskSubmission, { payload: TaskSubmissionPayload }>({
            query: ({ payload }) => {
                const fd = new FormData();

                fd.append("task_id", String(payload.task_id));

                if (payload.submission_text !== undefined && payload.submission_text !== null) {
                    fd.append("submission_text", String(payload.submission_text));
                }

                if (payload.uploaded_files?.length) {
                    payload.uploaded_files.forEach((v) => fd.append("uploaded_files", String(v)));
                }

                if (payload.deleted_files_ids?.length) {
                    payload.deleted_files_ids.forEach((v) => fd.append("deleted_file_ids", String(v)));
                }

                return {
                    url: "/task-submission/",
                    method: "POST",
                    body: fd,
                };
            },
            invalidatesTags: [{ type: "TaskSubmission" as const, id: "LIST" }],
        }),

        updateTaskSubmission: builder.mutation<
            TaskSubmission,
            { id: number; payload: TaskSubmissionPayload }
        >({
            query: ({ id, payload }) => {
                const fd = new FormData();

                fd.append("task_id", String(payload.task_id));

                if (payload.submission_text !== undefined && payload.submission_text !== null) {
                    fd.append("submission_text", String(payload.submission_text));
                }

                if (payload.uploaded_files?.length) {
                    payload.uploaded_files.forEach((v) => fd.append("uploaded_files", String(v)));
                }

                if (payload.deleted_files_ids?.length) {
                    payload.deleted_files_ids.forEach((v) => fd.append("deleted_file_ids", String(v)));
                }

                return {
                    url: `/task-submission/${id}/`,
                    method: "PUT",
                    body: fd,
                };
            },
            invalidatesTags: (_res, _err, arg) => [
                { type: "TaskSubmission" as const, id: arg.id },
                { type: "TaskSubmission" as const, id: "LIST" },
            ],
        }),

        partialUpdateTaskSubmission: builder.mutation<
            TaskSubmission,
            { id: number; payload: TaskSubmissionPayload }
        >({
            query: ({ id, payload }) => {
                const fd = new FormData();

                fd.append("task_id", String(payload.task_id));

                if (payload.submission_text !== undefined && payload.submission_text !== null) {
                    fd.append("submission_text", String(payload.submission_text));
                }

                if (payload.uploaded_files?.length) {
                    payload.uploaded_files.forEach((v) => fd.append("uploaded_files", String(v)));
                }

                if (payload.deleted_files_ids?.length) {
                    payload.deleted_files_ids.forEach((v) => fd.append("deleted_file_ids", String(v)));
                }

                return {
                    url: `/task-submission/${id}/`,
                    method: "PATCH",
                    body: fd,
                };
            },
            invalidatesTags: (_res, _err, arg) => [
                { type: "TaskSubmission" as const, id: arg.id },
                { type: "TaskSubmission" as const, id: "LIST" },
            ],
        }),

        deleteTaskSubmission: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `/task-submission/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "TaskSubmission" as const, id: arg.id },
                { type: "TaskSubmission" as const, id: "LIST" },
            ],
        }),

        // --------------------
        // TaskSubmissionReview
        // --------------------

        getTaskSubmissionReviews: builder.query<TaskReviewResponse, {
            page?: number;
            page_size?: number;
            ordering?: "created_at" | "-created_at" | "updated_at" | "-updated_at";
            group_id?: number;
            student_id?: number;
            task_id?: number;
            is_rated?: boolean;
        }>({
            query: (params) => ({
                url: "/task-submission-review/",
                method: "GET",
                params, // без фільтрів — {}
            }),
            providesTags: (res) =>
                res?.results
                    ? [
                        { type: "TaskReview" as const, id: "LIST" },
                        ...res.results.map((r) => ({ type: "TaskReview" as const, id: r.id })),
                    ]
                    : [{ type: "TaskReview" as const, id: "LIST" }],
        }),

        getTaskSubmissionReviewById: builder.query<TaskReview, { id: number }>({
            query: ({ id }) => ({
                url: `/task-submission-review/${id}/`,
                method: "GET",
            }),
            providesTags: (_res, _err, arg) => [{ type: "TaskReview" as const, id: arg.id }],
        }),

        rateTaskSubmission: builder.mutation<
            TaskReview,
            { id: number; payload: RateTaskSubmissionPayload }
        >({
            query: ({ id, payload }) => {
                const fd = new FormData();

                if (payload.value !== undefined && payload.value !== null) {
                    fd.append("value", String(payload.value));
                }
                if (payload.comment !== undefined && payload.comment !== null) {
                    fd.append("comment", String(payload.comment));
                }

                if (payload.uploaded_files?.length) {
                    payload.uploaded_files.forEach((v) => fd.append("uploaded_files", String(v)));
                }
                if (payload.deleted_file_ids?.length) {
                    payload.deleted_file_ids.forEach((v) => fd.append("deleted_file_ids", String(v)));
                }

                return {
                    url: `/task-submission-review/${id}/rate/`,
                    method: "POST",
                    body: fd,
                };
            },
            invalidatesTags: (_res, _err, arg) => [
                { type: "TaskReview" as const, id: arg.id },
                { type: "TaskReview" as const, id: "LIST" },
                { type: "TaskSubmission" as const, id: arg.id },
                { type: "TaskSubmission" as const, id: "LIST" },
            ],
        }),

        unrateTaskSubmission: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `/task-submission-review/${id}/unrate/`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "TaskReview" as const, id: arg.id },
                { type: "TaskReview" as const, id: "LIST" },
                { type: "TaskSubmission" as const, id: arg.id },
                { type: "TaskSubmission" as const, id: "LIST" },
            ],
        }),
    }),
});

export const {
    // tasks
    useGetTasksQuery,
    useGetTaskByIdQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    usePartialUpdateTaskMutation,
    useDeleteTaskMutation,

    // submissions
    useGetTaskSubmissionsQuery,
    useGetTaskSubmissionByIdQuery,
    useCreateTaskSubmissionMutation,
    useUpdateTaskSubmissionMutation,
    usePartialUpdateTaskSubmissionMutation,
    useDeleteTaskSubmissionMutation,

    // reviews
    useGetTaskSubmissionReviewsQuery,
    useGetTaskSubmissionReviewByIdQuery,
    useRateTaskSubmissionMutation,
    useUnrateTaskSubmissionMutation,
} = taskApi;
