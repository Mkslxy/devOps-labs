import {
  AvailableTeacher,
  CancelLessonByTeacherPayload,
  CancelLessonByTeacherResponse,
  CreateRecurringLessonPayload,
  Lesson, LessonPatchRequest, LessonPlanPayload, LessonPlanReviewAction, LessonPlanReviewPayload,
  LessonRequest,
  LessonResponse,
  LessonType,
  LessonTypePayload,
  LessonTypeResponse, WeeklySchedule
} from "./lesson.type";
import {baseApi} from "@/store/baseApi";

export const lessonApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllLessons: builder.query<
        LessonResponse,
        { start?: string; end?: string; teacher?: number; page_size?: number; page?: number }
    >({
      query: (params) => ({
        url: "lessons/",
        params: {
          start: params.start,
          end: params.end,
          ...(params.teacher && { teacher: params.teacher }),
          page_size: params.page_size,
          page: params.page,
        },
      }),

      transformResponse: (response: LessonResponse | Lesson[]) => {
        if (Array.isArray(response)) {
          return {
            count: response.length,
            next: null,
            previous: null,
            results: response,
          } satisfies LessonResponse;
        }

        return response;
      },

      providesTags: (result, error, arg) => [
        { type: "Lesson", id: "LIST" },
        { type: "Lesson", id: `TEACHER_${arg.teacher ?? "ALL"}` },
        { type: "Lesson", id: `RANGE_${arg.teacher ?? "ALL"}_${arg.start}_${arg.end}` },
        ...(result?.results?.map((l) => ({ type: "Lesson" as const, id: l.id })) ?? []),
      ],
    }),
    getLessonById: builder.query<Lesson, number>({
      query: (id) => `lessons/${id}/`,
    }),
    createLesson: builder.mutation<Lesson, LessonRequest>({
      query: (body) => ({
        url: "lessons/",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Lesson", id: "LIST" },
        { type: "Lesson", id: `TEACHER_${arg.teacher_id}` },
      ],
    }),
    updateLesson: builder.mutation<Lesson, { id: number; data: LessonPatchRequest }>(
      {
        query: ({ id, data }) => ({
          url: `lessons/${id}/`,
          method: "PATCH",
          body: data,
        }),
        invalidatesTags: (result, error, arg) => [
          { type: "Lesson", id: arg.id },
          { type: "Lesson", id: "LIST" },
          ...(arg.data.teacher_id ? [{ type: "Lesson" as const, id: `TEACHER_${arg.data.teacher_id}` }] : []),
        ],
      }
    ),
    deleteLesson: builder.mutation<Lesson, { id: number; teacherId?: number }>({
      query: ({ id }) => ({
        url: `lessons/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Lesson", id: arg.id },
        { type: "Lesson", id: "LIST" },
        ...(arg.teacherId ? [{ type: "Lesson" as const, id: `TEACHER_${arg.teacherId}` }] : []),
      ],
    }),

    getLessonTypes: builder.query<LessonTypeResponse, void>({
      query: () => "/lesson-types/",
      providesTags: ["LessonType"],
    }),

    createLessonType: builder.mutation<LessonType, LessonTypePayload>({
      query: (body) => ({
        url: "/lesson-types/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LessonType"],
    }),

    updateLessonType: builder.mutation<
        LessonType,
        { id: number; data: LessonTypePayload }
    >({
      query: ({ id, data }) => ({
        url: `/lesson-types/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["LessonType"],
    }),

    deleteLessonType: builder.mutation<void, number>({
      query: (id) => ({
        url: `/lesson-types/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["LessonType"],
    }),

    createRecurringLessons: builder.mutation<
        WeeklySchedule,
        CreateRecurringLessonPayload
    >({
      query: (body) => ({
        url: "lessons/create-recurring/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Lesson" as const, id: "LIST" }],
    }),

    cancelLessonByTeacher: builder.mutation<
        CancelLessonByTeacherResponse,
        CancelLessonByTeacherPayload
    >({
      query: ({ id, reason }) => {
        const fd = new FormData();
        fd.append("reason", reason);

        return {
          url: `/lessons/${id}/cancel-lesson/`,
          method: "POST",
          body: fd,
        };
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Lesson" as const, id },
        { type: "Lesson" as const, id: "LIST" },
      ],
    }),

    getAvailableTeachersByLessonId: builder.query<AvailableTeacher[], number>({
      query: (id) => `lessons/${id}/available-teachers/`,
    }),


    updateLessonPlan: builder.mutation<
        { lesson_plan: string },
        { id: number; data: LessonPlanPayload }
    >({
      query: ({ id, data }) => {
        const formData = new FormData();
        formData.append("lesson_plan", data.lesson_plan);
        formData.append("send_for_review", String(data.send_for_review));

        return {
          url: `/lessons/${id}/update-plan/`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Lesson", id },
        { type: "Lesson", id: "LIST" },
      ],
    }),

    reviewLessonPlan: builder.mutation<
        { action: LessonPlanReviewAction; feedback?: string },
        { id: number; data: LessonPlanReviewPayload }
    >({
      query: ({ id, data }) => {
        const formData = new FormData();
        formData.append("action", data.action);

        if (data.feedback) {
          formData.append("feedback", data.feedback);
        }

        return {
          url: `/lessons/${id}/review-plan/`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Lesson", id },
        { type: "Lesson", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetLessonTypesQuery,
  useCreateLessonTypeMutation,
  useUpdateLessonTypeMutation,
  useDeleteLessonTypeMutation,
  useGetAllLessonsQuery,
  useCreateRecurringLessonsMutation,
  useCancelLessonByTeacherMutation,
  useGetLessonByIdQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useGetAvailableTeachersByLessonIdQuery,
  useDeleteLessonMutation,
  useUpdateLessonPlanMutation,
  useReviewLessonPlanMutation
} = lessonApi;
