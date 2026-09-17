import { baseApi } from "@/store/baseApi";
import { toFormData } from "@/libs/formdata";
import {
    MagicCoursePayload,
    MagicCourseResponse,
} from "@/store/magic-import/magic-course.type";

export const magicCourseApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        importMagicCourse: builder.mutation<MagicCourseResponse, MagicCoursePayload>({
            query: (data) => ({
                url: "/magic-import/course-import/",
                method: "POST",
                body: toFormData(data),
            }),
        }),
    }),
});

export const { useImportMagicCourseMutation } = magicCourseApi;