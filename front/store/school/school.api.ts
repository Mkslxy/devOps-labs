import { baseApi } from "@/store/baseApi";
import {School, SchoolPayload, SchoolResponse} from "@/store/school/school.type";

export const schoolApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSchools: builder.query<
            SchoolResponse,
            { format?: "json" | "xlsx"; page?: number; search?: string } | void
        >({
            query: (params) => ({
                url: "/schools/",
                ...(params ? { params } : {}),
            }),
            providesTags: (res) =>
                res
                    ? [
                        { type: "School", id: "LIST" },
                        ...res.results.map((s) => ({ type: "School" as const, id: s.id })),
                    ]
                    : [{ type: "School", id: "LIST" }],
        }),

        getSchoolById: builder.query<School, number>({
            query: (id) => ({ url: `/schools/${id}/` }),
            providesTags: (_r, _e, id) => [{ type: "School", id }],
        }),

        createSchool: builder.mutation<School, SchoolPayload>({
            query: (data) => {
                const form = new FormData();
                form.append("name", data.name);
                form.append("address", data.address);
                form.append("city", data.city);
                if (data.latitude != null) form.append("latitude", String(data.latitude));
                if (data.longitude != null) form.append("longitude", String(data.longitude));

                return {
                    url: "/schools/",
                    method: "POST",
                    body: form,
                };
            },
            invalidatesTags: [{ type: "School", id: "LIST" }],
        }),

        updateSchool: builder.mutation<School, { id: number; data: SchoolPayload }>({
            query: ({ id, data }) => {
                const form = new FormData();
                form.append("name", data.name);
                form.append("address", data.address);
                form.append("city", data.city);
                if (data.latitude != null) form.append("latitude", String(data.latitude));
                if (data.longitude != null) form.append("longitude", String(data.longitude));

                return {
                    url: `/schools/${id}/`,
                    method: "PUT",
                    body: form,
                };
            },
            invalidatesTags: (_r, _e, arg) => [
                { type: "School", id: "LIST" },
                { type: "School", id: arg.id },
            ],
        }),

        patchSchool: builder.mutation<
            School,
            { id: number; data: Partial<SchoolPayload> }
        >({
            query: ({ id, data }) => {
                const form = new FormData();
                if (data.name != null) form.append("name", data.name);
                if (data.address != null) form.append("address", data.address);
                if (data.city != null) form.append("city", data.city);
                if (data.latitude != null) form.append("latitude", String(data.latitude));
                if (data.longitude != null) form.append("longitude", String(data.longitude));

                return {
                    url: `/schools/${id}/`,
                    method: "PATCH",
                    body: form,
                };
            },
            invalidatesTags: (_r, _e, arg) => [
                { type: "School", id: "LIST" },
                { type: "School", id: arg.id },
            ],
        }),

        deleteSchool: builder.mutation<void, number>({
            query: (id) => ({
                url: `/schools/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, id) => [
                { type: "School", id: "LIST" },
                { type: "School", id },
            ],
        }),

        exportSchoolsXlsx: builder.query<Blob, void>({
            query: () => ({
                url: "/schools/export/",
                method: "GET",
                responseHandler: (response) => response.blob(),
            }),
        }),
    }),
});

export const {
    useGetSchoolsQuery,
    useLazyGetSchoolsQuery,
    useGetSchoolByIdQuery,

    useCreateSchoolMutation,
    useUpdateSchoolMutation,
    usePatchSchoolMutation,
    useDeleteSchoolMutation,

    useLazyExportSchoolsXlsxQuery,
} = schoolApi;