import { baseApi } from "@/store/baseApi";
import type {
    Material,
    MaterialResponse,
    MaterialListParams,
    MaterialPayload,
} from "@/store/material/material.type";

export const materialApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getMaterials: builder.query<MaterialResponse, MaterialListParams>({
            query: (params) => ({
                url: "/material/",
                params,
            }),
            providesTags: [{ type: "Material", id: "LIST" }],
        }),

        getMaterialById: builder.query<Material, number>({
            query: (id) => `/material/${id}/`,
            providesTags: (_r, _e, id) => [{ type: "Material", id }],
        }),

        createMaterial: builder.mutation<Material, MaterialPayload>({
            query: (data) => {
                const fd = new FormData();

                if (data.topic !== undefined) fd.append("topic", String(data.topic));
                if (data.title !== undefined) fd.append("title", data.title);
                if (data.description !== undefined) fd.append("description", data.description);
                if (data.access_level !== undefined) fd.append("access_level", data.access_level);

                (data.uploaded_files ?? []).forEach((file) => fd.append("uploaded_files", file));
                (data.deleted_file_ids ?? []).forEach((id) => fd.append("deleted_file_ids", String(id)));
                if (data.links_json !== undefined) fd.append("links_json", data.links_json);
                (data.deleted_link_ids ?? []).forEach((id) => fd.append("deleted_link_ids", String(id)));

                return {
                    url: "/material/",
                    method: "POST",
                    body: fd,
                };
            },
            invalidatesTags: [{ type: "Material", id: "LIST" }],
        }),

        updateMaterial: builder.mutation<Material, { id: number; data: MaterialPayload }>({
            query: ({ id, data }) => {
                const fd = new FormData();

                if (data.topic !== undefined) fd.append("topic", String(data.topic));
                if (data.title !== undefined) fd.append("title", data.title);
                if (data.description !== undefined) fd.append("description", data.description);
                if (data.access_level !== undefined) fd.append("access_level", data.access_level);

                (data.uploaded_files ?? []).forEach((file) => fd.append("uploaded_files", file));
                (data.deleted_file_ids ?? []).forEach((fid) => fd.append("deleted_file_ids", String(fid)));
                if (data.links_json !== undefined) fd.append("links_json", data.links_json);
                (data.deleted_link_ids ?? []).forEach((lid) => fd.append("deleted_link_ids", String(lid)));

                return {
                    url: `/material/${id}/`,
                    method: "PATCH",
                    body: fd,
                };
            },
            invalidatesTags: (_r, _e, { id }) => [
                { type: "Material", id },
                { type: "Material", id: "LIST" },
            ],
        }),

        deleteMaterial: builder.mutation<void, number>({
            query: (id) => ({
                url: `/material/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "Material", id: "LIST" }],
        }),
    }),
});

export const {
    useGetMaterialsQuery,
    useGetMaterialByIdQuery,
    useCreateMaterialMutation,
    useUpdateMaterialMutation,
    useDeleteMaterialMutation,
} = materialApi;
