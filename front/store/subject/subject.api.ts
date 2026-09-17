import { baseApi } from "@/store/baseApi";
import type {
    Subject,
    SubjectListParams,
    SubjectPayload,
    SubjectResponse,
} from "@/store/subject/subject.type";

export const subjectApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSubjects: builder.query<SubjectResponse, SubjectListParams>({
            query: (params) => ({
                url: "/subject/",
                params,
            }),
            providesTags: [{ type: "Subject", id: "LIST" }],
        }),

        getSubjectById: builder.query<Subject, number>({
            query: (id) => `/subject/${id}/`,
            providesTags: (_r, _e, id) => [{ type: "Subject", id }],
        }),

        createSubject: builder.mutation<Subject, SubjectPayload>({
            query: (body) => ({
                url: "/subject/",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Subject", id: "LIST" }],
        }),

        updateSubject: builder.mutation<
            Subject,
            { id: number; data: SubjectPayload }
        >({
            query: ({ id, data }) => ({
                url: `/subject/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_r, _e, { id }) => [
                { type: "Subject", id },
                { type: "Subject", id: "LIST" },
            ],
        }),

        deleteSubject: builder.mutation<void, number>({
            query: (id) => ({
                url: `/subject/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, id) => [
                { type: "Subject", id },
                { type: "Subject", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useGetSubjectsQuery,
    useGetSubjectByIdQuery,
    useCreateSubjectMutation,
    useUpdateSubjectMutation,
    useDeleteSubjectMutation,
} = subjectApi;