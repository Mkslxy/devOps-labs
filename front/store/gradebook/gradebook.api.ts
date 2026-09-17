import { baseApi } from "@/store/baseApi";
import type {
    GradeBookColumn,
    GradeBookColumnPayload,
    GradeBookColumnResponse,

    GradeBookGrade,
    GradeBookGradePayload,
    GradeBookGradeResponse,

    GradeBookAttendance,
    GradeBookAttendancePayload,
    GradeBookAttendanceResponse,

    GradebookGridResponse,
} from "@/store/gradebook/gradebook.type";

export const gradebookApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // =========================
        // GradeBook Grade CRUD
        // =========================

        getGradeBookGrade: builder.query<
            GradeBookGradeResponse,
            {
                category?: string; column?: number; created_after?: string; created_before?: string;
                group?: number; ordering?: string; page?: number; page_size?: number; student?: number;
                value_max?: number; value_min?: number;
            }
        >({
            query: ({ ...params }) => ({
                url: `/gradebook/grade/`,
                params,
            }),
            providesTags: (result) =>
                result?.results?.length
                    ? [
                        ...result.results.map((g) => ({ type: "GradeBookGrade" as const, id: g.id })),
                        { type: "GradeBookGrade" as const, id: "LIST" },
                    ]
                    : [{ type: "GradeBookGrade" as const, id: "LIST" }],
        }),

        getGradeBookGradeById: builder.query<GradeBookGrade, number>({
            query: (id) => ({
                url: `/gradebook/grade/${id}/`,
            }),
            providesTags: (_r, _e, id) => [{ type: "GradeBookGrade" as const, id }],
        }),

        createGradeBookGrade: builder.mutation<GradeBookGrade, GradeBookGradePayload>({
            query: (data) => {
                const fd = new FormData();

                fd.append("category", data.category);
                fd.append("student", String(data.student));
                fd.append("column", String(data.column));

                if (data.value !== undefined && data.value !== null) fd.append("value", String(data.value));
                if (data.comment !== undefined && data.comment !== null) fd.append("comment", data.comment);

                if (data.uploaded_files?.length) data.uploaded_files.forEach((file) => fd.append("uploaded_files", file));
                if (data.deleted_file_ids?.length) data.deleted_file_ids.forEach((id) => fd.append("deleted_file_ids", String(id)));

                return {
                    url: `/gradebook/grade/`,
                    method: "POST",
                    body: fd,
                };
            },
            invalidatesTags: [
                { type: "GradeBookGrade" as const, id: "LIST" },
                { type: "GradeBookGrid" as const, id: "GRID" },
            ],
        }),

        updateGradeBookGrade: builder.mutation<
            GradeBookGrade,
            { id: number; data: Partial<GradeBookGradePayload> }
        >({
            query: ({ id, data }) => {
                const fd = new FormData();

                if (data.category) fd.append("category", data.category);
                if (typeof data.student === "number") fd.append("student", String(data.student));
                if (typeof data.column === "number") fd.append("column", String(data.column));

                if (data.value !== undefined && data.value !== null) fd.append("value", String(data.value));
                if (data.comment !== undefined && data.comment !== null) fd.append("comment", data.comment);

                if (data.uploaded_files?.length) data.uploaded_files.forEach((file) => fd.append("uploaded_files", file));
                if (data.deleted_file_ids?.length) data.deleted_file_ids.forEach((fileId) => fd.append("deleted_file_ids", String(fileId)));

                return {
                    url: `/gradebook/grade/${id}/`,
                    method: "PATCH",
                    body: fd,
                };
            },
            invalidatesTags: (_r, _e, { id }) => [
                { type: "GradeBookGrade" as const, id },
                { type: "GradeBookGrade" as const, id: "LIST" },
                { type: "GradeBookGrid" as const, id: "GRID" },
            ],
        }),

        deleteGradeBookGrade: builder.mutation<void, number>({
            query: (id) => ({
                url: `/gradebook/grade/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, id) => [
                { type: "GradeBookGrade" as const, id },
                { type: "GradeBookGrade" as const, id: "LIST" },
                { type: "GradeBookGrid" as const, id: "GRID" },
            ],
        }),

        // =========================
        // GradeBook Column CRUD
        // =========================

        getGradeBookColumn: builder.query<
            GradeBookColumnResponse,
            {
                date_after?: string; date_before?: string;
                group?: number; ordering?: string;
                page?: number; page_size?: number;
                title?: string;
            }
        >({
            query: ({ ...params }) => ({
                url: `/gradebook/column/`,
                params,
            }),
            providesTags: (result) =>
                result?.results?.length
                    ? [
                        ...result.results.map((c) => ({ type: "GradeBookColumn" as const, id: c.id })),
                        { type: "GradeBookColumn" as const, id: "LIST" },
                    ]
                    : [{ type: "GradeBookColumn" as const, id: "LIST" }],
        }),

        getGradeBookColumnById: builder.query<GradeBookColumn, number>({
            query: (id) => ({
                url: `/gradebook/column/${id}/`,
            }),
            providesTags: (_r, _e, id) => [{ type: "GradeBookColumn" as const, id }],
        }),

        createGradeBookColumn: builder.mutation<GradeBookColumn, GradeBookColumnPayload>({
            query: (data) => {
                const fd = new FormData();

                fd.append("group", String(data.group));
                fd.append("title", data.title);

                if (data.comment) fd.append("comment", data.comment);

                if (Array.isArray(data.date)) data.date.forEach((d) => fd.append("date", d));
                else if (data.date) fd.append("date", data.date);

                return {
                    url: `/gradebook/column/`,
                    method: "POST",
                    body: fd,
                };
            },
            invalidatesTags: [
                { type: "GradeBookColumn" as const, id: "LIST" },
                { type: "GradeBookGrid" as const, id: "GRID" },
            ],
        }),

        updateGradeBookColumn: builder.mutation<
            GradeBookColumn,
            { id: number; data: GradeBookColumnPayload }
        >({
            query: ({ id, data }) => ({
                url: `/gradebook/column/${id}/`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (_r, _e, { id }) => [
                { type: "GradeBookColumn" as const, id },
                { type: "GradeBookColumn" as const, id: "LIST" },
                { type: "GradeBookGrid" as const, id: "GRID" },
            ],
        }),

        patchGradeBookColumn: builder.mutation<
            GradeBookColumn,
            { id: number; data: Partial<GradeBookColumnPayload> }
        >({
            query: ({ id, data }) => ({
                url: `/gradebook/column/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_r, _e, { id }) => [
                { type: "GradeBookColumn" as const, id },
                { type: "GradeBookColumn" as const, id: "LIST" },
                { type: "GradeBookGrid" as const, id: "GRID" },
            ],
        }),

        deleteGradeBookColumn: builder.mutation<void, number>({
            query: (id) => ({
                url: `/gradebook/column/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, id) => [
                { type: "GradeBookColumn" as const, id },
                { type: "GradeBookColumn" as const, id: "LIST" },
                { type: "GradeBookGrid" as const, id: "GRID" },
            ],
        }),

        createGradeBookColumnBatch: builder.mutation<GradeBookColumnResponse, GradeBookColumnPayload>({
            query: (body) => ({
                url: `/gradebook/column/batch/`,
                method: "POST",
                body,
            }),
            invalidatesTags: [
                { type: "GradeBookColumn" as const, id: "LIST" },
                { type: "GradeBookGrid" as const, id: "GRID" },
            ],
        }),

        // =========================
        // GradeBook Attendance CRUD
        // =========================

        getGradeBookAttendance: builder.query<
            GradeBookAttendanceResponse,
            {
                category?: string; column?: number; created_after?: string; created_before?: string;
                created_by?: number; group?: number; ordering?: string;
                page?: number; page_size?: number; student?: number;
            }
        >({
            query: ({ ...params }) => ({
                url: `/gradebook/attendance/`,
                params,
            }),
            providesTags: (result) =>
                result?.results?.length
                    ? [
                        ...result.results.map((a) => ({ type: "GradeBookAttendance" as const, id: a.id })),
                        { type: "GradeBookAttendance" as const, id: "LIST" },
                    ]
                    : [{ type: "GradeBookAttendance" as const, id: "LIST" }],
        }),

        getGradeBookAttendanceById: builder.query<GradeBookAttendance, number>({
            query: (id) => ({
                url: `/gradebook/attendance/${id}/`,
            }),
            providesTags: (_r, _e, id) => [{ type: "GradeBookAttendance" as const, id }],
        }),

        createGradeBookAttendance: builder.mutation<GradeBookAttendance, GradeBookAttendancePayload>({
            query: (body) => ({
                url: `/gradebook/attendance/`,
                method: "POST",
                body,
            }),
            invalidatesTags: [
                { type: "GradeBookAttendance" as const, id: "LIST" },
                { type: "GradeBookGrid" as const, id: "GRID" },
            ],
        }),

        updateGradeBookAttendance: builder.mutation<
            GradeBookAttendance,
            { id: number; data: GradeBookAttendancePayload }
        >({
            query: ({ id, data }) => ({
                url: `/gradebook/attendance/${id}/`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (_r, _e, { id }) => [
                { type: "GradeBookAttendance" as const, id },
                { type: "GradeBookAttendance" as const, id: "LIST" },
                { type: "GradeBookGrid" as const, id: "GRID" },
            ],
        }),

        patchGradeBookAttendance: builder.mutation<
            GradeBookAttendance,
            { id: number; data: Partial<GradeBookAttendancePayload> }
        >({
            query: ({ id, data }) => ({
                url: `/gradebook/attendance/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_r, _e, { id }) => [
                { type: "GradeBookAttendance" as const, id },
                { type: "GradeBookAttendance" as const, id: "LIST" },
                { type: "GradeBookGrid" as const, id: "GRID" },
            ],
        }),

        deleteGradeBookAttendance: builder.mutation<void, number>({
            query: (id) => ({
                url: `/gradebook/attendance/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, id) => [
                { type: "GradeBookAttendance" as const, id },
                { type: "GradeBookAttendance" as const, id: "LIST" },
                { type: "GradeBookGrid" as const, id: "GRID" },
            ],
        }),

        createGradeBookAttendanceBatch: builder.mutation<
            GradeBookAttendanceResponse,
            GradeBookAttendancePayload
        >({
            query: (body) => ({
                url: `/gradebook/attendance/batch/`,
                method: "POST",
                body,
            }),
            invalidatesTags: [
                { type: "GradeBookAttendance" as const, id: "LIST" },
                { type: "GradeBookGrid" as const, id: "GRID" },
            ],
        }),

        // =========================
        // GradeBook Main Journal
        // =========================

        getGradebookGrid: builder.query<GradebookGridResponse, { end_date?: string; group_id: number; start_date?: string }>(
            {
                query: (params) => ({
                    url: `/gradebook/grid/`,
                    params,
                }),
                providesTags: [{ type: "GradeBookGrid" as const, id: "GRID" }],
            }
        ),
    }),
});

export const {
    // Grade
    useGetGradeBookGradeQuery,
    useGetGradeBookGradeByIdQuery,
    useCreateGradeBookGradeMutation,
    useUpdateGradeBookGradeMutation,
    useDeleteGradeBookGradeMutation,

    // Column
    useGetGradeBookColumnQuery,
    useGetGradeBookColumnByIdQuery,
    useCreateGradeBookColumnMutation,
    useUpdateGradeBookColumnMutation,
    usePatchGradeBookColumnMutation,
    useDeleteGradeBookColumnMutation,
    useCreateGradeBookColumnBatchMutation,

    // Attendance
    useGetGradeBookAttendanceQuery,
    useGetGradeBookAttendanceByIdQuery,
    useCreateGradeBookAttendanceMutation,
    useUpdateGradeBookAttendanceMutation,
    usePatchGradeBookAttendanceMutation,
    useDeleteGradeBookAttendanceMutation,
    useCreateGradeBookAttendanceBatchMutation,

    // Main
    useGetGradebookGridQuery,
} = gradebookApi
