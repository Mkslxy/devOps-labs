import { baseApi } from "@/store/baseApi";
import { TeacherSalary } from "@/store/salary/teacher-salary.type";

export const teacherSalaryApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTeacherSalaryStats: builder.query<TeacherSalary, void>({
            query: () => ({
                url: "/me/teacher/lessons-stats",
                method: "GET",
            }),
        }),
    }),
});

export const { useGetTeacherSalaryStatsQuery } = teacherSalaryApi;