import { baseApi } from "@/store/baseApi";
import type { Module, ModulePayload, ModuleResponse } from "./module.type";

export const moduleApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getModules: builder.query<
            ModuleResponse,
            { page?: number; page_size?: number; ordering?: string }
        >({
            query: (params) => ({
                url: "/module/",
                params,
            }),
            providesTags: [{ type: "Module", id: "LIST" }],
        }),

        getModuleById: builder.query<Module, number>({
            query: (id) => `/module/${id}/`,
            providesTags: (_r, _e, id) => [{ type: "Module", id }],
        }),

        createModule: builder.mutation<Module, ModulePayload>({
            query: (body) => ({
                url: "/module/",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Module", id: "LIST" }],
        }),

        updateModule: builder.mutation<Module, { id: number; data: Partial<ModulePayload> }>({
            query: ({ id, data }) => ({
                url: `/module/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_r, _e, { id }) => [
                { type: "Module", id },
                { type: "Module", id: "LIST" },
            ],
        }),

        deleteModule: builder.mutation<void, number>({
            query: (id) => ({
                url: `/module/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "Module", id: "LIST" }],
        }),
    }),
});

export const {
    useGetModulesQuery,
    useGetModuleByIdQuery,
    useCreateModuleMutation,
    useUpdateModuleMutation,
    useDeleteModuleMutation,
} = moduleApi;
