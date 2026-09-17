import { baseApi } from "@/store/baseApi";
import type { PaginatedResponse } from "@/store/baseApi";
import {
    FrequencyEnum,
    ReportTemplate,
    ReportTemplatePayload,
} from "@/store/reports/report-template.type";
import { appendFd, toFormData } from "@/libs/formdata";

export const reportTemplateApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getReportTemplates: builder.query<
            PaginatedResponse<ReportTemplate>,
            {
                page?: number;
                page_size?: number;
                search?: string;
                created_by?: number;
                frequency?: FrequencyEnum;
                is_active?: boolean;
                is_recurring?: boolean;
                ordering?: string;
            }
        >({
            query: (params) => ({
                url: "reports/template/",
                method: "GET",
                params: {
                    page_size: 50,
                    ...params,
                },
            }),
            providesTags: ["Report"],
        }),

        getReportTemplateById: builder.query<ReportTemplate, number>({
            query: (id) => ({
                url: `reports/template/${id}/`,
                method: "GET",
            }),
            providesTags: ["Report"],
        }),

        createReportTemplate: builder.mutation<
            ReportTemplate,
            ReportTemplatePayload
        >({
            query: (data) => {
                const fd = toFormData(data, {
                    omit: ["auto_assign_to_roles"],
                });

                data.auto_assign_to_roles?.forEach((roleId) => {
                    appendFd(fd, "auto_assign_to_roles", roleId);
                });

                return {
                    url: "reports/template/",
                    method: "POST",
                    body: fd,
                };
            },
            invalidatesTags: ["Report"],
        }),

        updateReportTemplate: builder.mutation<
            ReportTemplate,
            { id: number; data: ReportTemplatePayload }
        >({
            query: ({ id, data }) => {
                const fd = toFormData(data, {
                    omit: ["auto_assign_to_roles"],
                });

                data.auto_assign_to_roles?.forEach((roleId) => {
                    appendFd(fd, "auto_assign_to_roles", roleId);
                });

                return {
                    url: `reports/template/${id}/`,
                    method: "PUT",
                    body: fd,
                };
            },
            invalidatesTags: ["Report"],
        }),

        patchReportTemplate: builder.mutation<
            ReportTemplate,
            { id: number; data: Partial<ReportTemplatePayload> }
        >({
            query: ({ id, data }) => {
                const fd = toFormData(data, {
                    omit: ["auto_assign_to_roles"],
                });

                data.auto_assign_to_roles?.forEach((roleId) => {
                    appendFd(fd, "auto_assign_to_roles", roleId);
                });

                return {
                    url: `reports/template/${id}/`,
                    method: "PATCH",
                    body: fd,
                };
            },
            invalidatesTags: ["Report"],
        }),

        deleteReportTemplate: builder.mutation<void, number>({
            query: (id) => ({
                url: `reports/template/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["Report"],
        }),
    }),
});

export const {
    useGetReportTemplatesQuery,
    useGetReportTemplateByIdQuery,
    useCreateReportTemplateMutation,
    useUpdateReportTemplateMutation,
    usePatchReportTemplateMutation,
    useDeleteReportTemplateMutation,
} = reportTemplateApi;