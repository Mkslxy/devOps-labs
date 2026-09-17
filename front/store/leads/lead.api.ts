"use client";

import { baseApi } from "@/store/baseApi";
import {
    CallBack,
    CallBackPayload,
    CallBackResponse,
    ConvertedLeadPayload, Lead, LeadPayload, LeadResponse, LeadStatusEnum,
} from "@/store/leads/lead.type";
import {
    CallBackRequestStatusEnum,
    ContactPreferenceEnum,
} from "@/store/leads/lead.type";

export const callbackLeadRequestApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        // =========================
        // CALLBACK REQUEST ( CRUD )
        // =========================
        getCallbackRequests: builder.query<
            CallBackResponse,
            {
                callback_page?: string;
                contact_preference?: ContactPreferenceEnum;
                status?: CallBackRequestStatusEnum;
                ordering?: "id" | "-id" | "created_at" | "-created_at" | "updated_at" | "-updated_at";
                page?: number;
                page_size?: number;
                search?: string;
            }
        >({
            query: (params) => ({
                url: "/callback-request/",
                method: "GET",
                params,
            }),
            providesTags: [{ type: "CallbackRequest", id: "LIST" }],
        }),

        getCallbackRequestById: builder.query<CallBack, { id: number }>({
            query: ({ id }) => ({
                url: `/callback-request/${id}/`,
                method: "GET",
            }),
            providesTags: (res, err, arg) => [
                { type: "CallbackRequest", id: arg.id },
            ],
        }),

        createCallbackRequest: builder.mutation<CallBack, CallBackPayload>({
            query: (body) => {
                const formData = new FormData();

                formData.append("full_name", body.full_name);
                if (body.email) formData.append("email", body.email);
                formData.append("phone_country_code", body.phone_country_code);
                formData.append("phone_national_number", body.phone_national_number);
                if (body.message) formData.append("message", body.message);

                if (body.contact_preference?.[0])
                    formData.append("contact_preference", body.contact_preference[0]);

                if (body.other_contact_preference)
                    formData.append("other_contact_preference", body.other_contact_preference);

                if (body.status?.[0])
                    formData.append("status", body.status[0]);

                formData.append("callback_page", body.callback_page);

                if (body.city) formData.append("city", body.city);
                if (body.manager_comment)
                    formData.append("manager_comment", body.manager_comment);
                if (body.converted_lead !== undefined)
                    formData.append("converted_lead", String(body.converted_lead));

                return {
                    url: "/callback-request/",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: [{ type: "CallbackRequest", id: "LIST" }],
        }),

        updateCallbackRequest: builder.mutation<
            CallBack,
            { id: number; data: Partial<CallBackPayload> }
        >({
            query: ({ id, data }) => {
                const formData = new FormData();

                if (data.full_name) formData.append("full_name", data.full_name);
                if (data.email) formData.append("email", data.email);
                if (data.phone_country_code)
                    formData.append("phone_country_code", data.phone_country_code);
                if (data.phone_national_number)
                    formData.append("phone_national_number", data.phone_national_number);
                if (data.message) formData.append("message", data.message);

                if (data.contact_preference?.[0])
                    formData.append("contact_preference", data.contact_preference[0]);

                if (data.other_contact_preference)
                    formData.append("other_contact_preference", data.other_contact_preference);

                if (data.status?.[0])
                    formData.append("status", data.status[0]);

                if (data.callback_page)
                    formData.append("callback_page", data.callback_page);

                if (data.city) formData.append("city", data.city);
                if (data.manager_comment)
                    formData.append("manager_comment", data.manager_comment);
                if (data.converted_lead !== undefined)
                    formData.append("converted_lead", String(data.converted_lead));

                return {
                    url: `/callback-request/${id}/`,
                    method: "PATCH",
                    body: formData,
                };
            },
            invalidatesTags: (res, err, arg) => [
                { type: "CallbackRequest", id: "LIST" },
                { type: "CallbackRequest", id: arg.id },
            ],
        }),

        deleteCallbackRequest: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `/callback-request/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (res, err, arg) => [
                { type: "CallbackRequest", id: "LIST" },
                { type: "CallbackRequest", id: arg.id },
            ],
        }),

        // =========================
        // CREATE LEAD FROM CALLBACK
        // =========================
        createLeadFromCallback: builder.mutation<
            ConvertedLeadPayload,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `/callback-request/${id}/create-lead/`,
                method: "POST",
            }),
            invalidatesTags: (res, err, arg) => [
                { type: "CallbackRequest", id: "LIST" },
                { type: "CallbackRequest", id: arg.id },
                { type: "Lead", id: "LIST" },
            ],
        }),

        getLeads: builder.query<
            LeadResponse,
            {
                manager?: number;
                ordering?: "id" | "-id" | "created_at" | "-created_at" | "updated_at" | "-updated_at";
                page?: number;
                page_size?: number;
                search?: string;
                status?: LeadStatusEnum;
            }
        >({
            query: (params) => ({
                url: "/leads/",
                method: "GET",
                params,
            }),
            providesTags: [{ type: "Lead", id: "LIST" }],
        }),

        getLeadById: builder.query<Lead, { id: number }>({
            query: ({ id }) => ({
                url: `/leads/${id}/`,
                method: "GET",
            }),
            providesTags: (res, err, arg) => [
                { type: "Lead", id: arg.id },
            ],
        }),

        createLead: builder.mutation<Lead, LeadPayload>({
            query: (body) => {
                const formData = new FormData();

                if (body.manager_id !== undefined)
                    formData.append("manager_id", String(body.manager_id));

                formData.append("name", body.name);

                if (body.email) formData.append("email", body.email);
                if (body.phone) formData.append("phone", body.phone);

                formData.append("source", body.source);

                if (body.status?.[0])
                    formData.append("status", body.status[0]);

                if (body.notes) formData.append("notes", body.notes);
                if (body.city) formData.append("city", body.city);

                return {
                    url: "/leads/",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: [{ type: "Lead", id: "LIST" }],
        }),

        updateLead: builder.mutation<
            Lead,
            { id: number; data: Partial<LeadPayload> }
        >({
            query: ({ id, data }) => {
                const formData = new FormData();

                if (data.manager_id !== undefined)
                    formData.append("manager_id", String(data.manager_id));

                if (data.name) formData.append("name", data.name);
                if (data.email) formData.append("email", data.email);
                if (data.phone) formData.append("phone", data.phone);
                if (data.source) formData.append("source", data.source);

                if (data.status?.[0])
                    formData.append("status", data.status[0]);

                if (data.notes) formData.append("notes", data.notes);
                if (data.city) formData.append("city", data.city);

                return {
                    url: `/leads/${id}/`,
                    method: "PATCH",
                    body: formData,
                };
            },
            invalidatesTags: (res, err, arg) => [
                { type: "Lead", id: "LIST" },
                { type: "Lead", id: arg.id },
            ],
        }),

        deleteLead: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `/leads/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (res, err, arg) => [
                { type: "Lead", id: "LIST" },
                { type: "Lead", id: arg.id },
            ],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetCallbackRequestsQuery,
    useGetCallbackRequestByIdQuery,
    useCreateCallbackRequestMutation,
    useUpdateCallbackRequestMutation,
    useDeleteCallbackRequestMutation,
    useCreateLeadFromCallbackMutation,

    // LEADS
    useGetLeadsQuery,
    useGetLeadByIdQuery,
    useCreateLeadMutation,
    useUpdateLeadMutation,
    useDeleteLeadMutation,
} = callbackLeadRequestApi;
