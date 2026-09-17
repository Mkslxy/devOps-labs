"use client";

import { baseApi } from "@/store/baseApi";
import { toFormData } from "@/libs/formdata";
import type { StaffMeeting, StaffMeetingPayload, StaffMeetingResponse } from "./staff-meeting.type";

export const staffMeetingApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getStaffMeetings: builder.query<
            StaffMeetingResponse,
            {
                created_at_after?: string;
                created_at_before?: string;
                updated_at_after?: string;
                updated_at_before?: string;
                created_by?: number;
                is_online?: boolean;
                page?: number;
                search?: string;
            }
        >({
            query: (params) => ({
                url: "/staff-meeting/",
                params: {
                    created_at_after: params.created_at_after,
                    created_at_before: params.created_at_before,
                    updated_at_after: params.updated_at_after,
                    updated_at_before: params.updated_at_before,
                    created_by: params.created_by,
                    is_online: params.is_online,
                    page: params.page,
                    search: params.search,
                },
            }),
            providesTags: (result) => [
                { type: "StaffMeeting", id: "LIST" },
                ...(result?.results?.map((m) => ({ type: "StaffMeeting" as const, id: m.id })) ?? []),
            ],
        }),

        getStaffMeetingById: builder.query<StaffMeeting, number>({
            query: (id) => ({
                url: `/staff-meeting/${id}/`,
            }),
            providesTags: (_r, _e, id) => [{ type: "StaffMeeting", id }],
        }),

        createStaffMeeting: builder.mutation<StaffMeeting, StaffMeetingPayload>({
            query: (data) => ({
                url: "/staff-meeting/",
                method: "POST",
                body: toFormData(data),
            }),
            invalidatesTags: [{ type: "StaffMeeting", id: "LIST" }],
        }),

        updateStaffMeeting: builder.mutation<StaffMeeting, { id: number; data: Partial<StaffMeetingPayload> }>({
            query: ({ id, data }) => ({
                url: `/staff-meeting/${id}/`,
                method: "PATCH",
                body: toFormData(data),
            }),
            invalidatesTags: (_r, _e, arg) => [
                { type: "StaffMeeting", id: "LIST" },
                { type: "StaffMeeting", id: arg.id },
            ],
        }),

        deleteStaffMeeting: builder.mutation<void, number>({
            query: (id) => ({
                url: `/staff-meeting/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, id) => [
                { type: "StaffMeeting", id: "LIST" },
                { type: "StaffMeeting", id },
            ],
        }),
    }),
});

export const {
    useGetStaffMeetingsQuery,
    useGetStaffMeetingByIdQuery,
    useCreateStaffMeetingMutation,
    useUpdateStaffMeetingMutation,
    useDeleteStaffMeetingMutation,
} = staffMeetingApi;
