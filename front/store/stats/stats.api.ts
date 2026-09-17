"use client";

import { baseApi } from "@/store/baseApi";
import type { StudentStats } from "./stats.type";
import type { ManagerDashboard, TeacherDashboard, StudentDashboard } from "./dashboard.type";

export interface GroupStatsResponse {
    tests: Record<string, unknown>;
}

export const statsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getStudentStatsMe: builder.query<StudentStats, void>({
            query: () => ({
                url: "/stats/me/",
                method: "GET",
            }),
            providesTags: [{ type: "Stats", id: "STUDENT_ME" }],
        }),

        getStudentStatsMeGroup: builder.query<StudentStats, { group_id: number }>({
            query: (params) => ({
                url: "/stats/me-group/",
                method: "GET",
                params,
            }),
            providesTags: (res, err, arg) => [{ type: "Stats", id: `STUDENT_ME_GROUP_${arg.group_id}` }],
        }),

        getStudentStatsById: builder.query<StudentStats, { student_id: number }>({
            query: (params) => ({
                url: "/stats/student/",
                method: "GET",
                params,
            }),
            providesTags: (res, err, arg) => [{ type: "Stats", id: `STUDENT_${arg.student_id}` }],
        }),

        getStudentStatsByIdInGroup: builder.query<
            StudentStats,
            { student_id: number; group_id: number }
        >({
            query: (params) => ({
                url: "/stats/student-group/",
                method: "GET",
                params,
            }),
            providesTags: (res, err, arg) => [
                { type: "Stats", id: `STUDENT_${arg.student_id}_GROUP_${arg.group_id}` },
            ],
        }),

        getGroupStats: builder.query<GroupStatsResponse, { group_id: number }>({
            query: ({ group_id }) => ({
                url: `/stats/group/${group_id}/`,
                method: "GET",
            }),
            providesTags: (res, err, arg) => [{ type: "Stats", id: `GROUP_${arg.group_id}` }],
        }),

        getManagerDashboard: builder.query<ManagerDashboard, void>({
            query: () => ({
                url: "/stats/dashboard/manager/",
                method: "GET",
            }),
            providesTags: [{ type: "Stats", id: "MANAGER_DASHBOARD" }],
        }),

        getTeacherDashboard: builder.query<TeacherDashboard, void>({
            query: () => ({
                url: "/stats/dashboard/teacher/",
                method: "GET",
            }),
            providesTags: [{ type: "Stats", id: "TEACHER_DASHBOARD" }],
        }),

        getStudentDashboard: builder.query<StudentDashboard, void>({
            query: () => ({
                url: "/stats/dashboard/student/",
                method: "GET",
            }),
            providesTags: [{ type: "Stats", id: "STUDENT_DASHBOARD" }],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetStudentStatsMeQuery,
    useGetStudentStatsMeGroupQuery,
    useGetStudentStatsByIdQuery,
    useGetStudentStatsByIdInGroupQuery,
    useGetGroupStatsQuery,
    useGetManagerDashboardQuery,
    useGetTeacherDashboardQuery,
    useGetStudentDashboardQuery,
} = statsApi;
