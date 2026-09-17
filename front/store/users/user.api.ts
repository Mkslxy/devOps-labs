import {
  ProfileRolesTreeResponse,
  RoleResponse,
  UserFormData,
  UserProfile,
  UserRequestUpdateProfile,
  UserResponse
} from "./user.type";
import {baseApi} from "@/store/baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfileMe: builder.query<UserProfile, void>({
      query: () => "profile/me/",
    }),
    updateProfileMe: builder.mutation<UserResponse, UserRequestUpdateProfile>({
      query: (user) => ({
        url: "profile/me/",
        method: "PATCH",
        body: user,
      }),
    }),
    getUserById: builder.query<UserFormData, number>({
      query: (id) => `users/${id}/`,
    }),
    getTeachers: builder.query<any, { search?: string; page?: number; page_size?: number; schools?: number[]; }>({
      query: (params) => ({
        url: "/users/",
        params: {
          role_slug: "teacher",
          ...params,
        },
      }),
      providesTags: ["Teacher"],
    }),
    getUsers: builder.query<any, { search?: string; page?: number; page_size?: number; }>({
      query: (params) => ({
        url: "/users/",
        params: {
          ...params,
        },
      }),
    }),
    getProfileRolesTree: builder.query<ProfileRolesTreeResponse, void>({
      query: () => ({
        url: "/profile/roles-tree/",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
    getMethodist: builder.query<any, { search?: string; page?: number; page_size?: number; }>({
      query: (params) => ({
        url: "/users/",
        params: {
          role_slug: "methodist",
          ...params,
        },
      }),
      providesTags: ["Methodist"],
    }),
    getFinancier: builder.query<any, { search?: string; page?: number; page_size?: number; }>({
      query: (params) => ({
        url: "/users/",
        params: {
          role_slug: "financier",
          ...params,
        },
      }),
      providesTags: ["Financier"],
    }),
    getManager: builder.query<any, { search?: string; page?: number; page_size?: number; }>({
      query: (params) => ({
        url: "/users/",
        params: {
          role_slug: "manager",
          ...params,
        },
      }),
      providesTags: ["Manager"],
    }),

    createTeacher: builder.mutation<any, any>({
      query: (body) => ({
        url: "/users/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Teacher"],
    }),

    updateTeacher: builder.mutation<any, { id: number; data: any }>({
      query: ({ id, data }) => ({
        url: `/users/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Teacher"],
    }),

    deleteTeacher: builder.mutation<void, number>({
      query: (id) => ({
        url: `/users/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Teacher"],
    }),

    getRoles: builder.query<RoleResponse, void>({
      query: () => "/roles/",
      providesTags: ["Role"],
    }),

    getStudents: builder.query<any, { search?: string; page?: number; page_size: number; }>({
      query: (params) => ({
        url: "/users/",
        params: {
          role_slug: "student",
          ...params,
        },
      }),
      providesTags: (result) =>
        result?.results
          ? [
            { type: "Student", id: "LIST" },
            ...result.results.map((s: any) => ({
              type: "Student" as const,
              id: s.id,
            })),
          ]
          : [{ type: "Student", id: "LIST" }],
    }),


    createStudent: builder.mutation<any, any>({
      query: (body) => ({
        url: "/users/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Student"],
    }),

    updateStudent: builder.mutation<any, { id: number; data: any }>({
      query: ({ id, data }) => ({
        url: `/users/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Student", id },
        { type: "Student", id: "LIST" },
        { type: "Group", id: "LIST" },
      ],
    }),

    deleteStudent: builder.mutation<void, number>({
      query: (id) => ({
        url: `/users/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Student", id },
        { type: "Student", id: "LIST" },
        { type: "Group", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetUserByIdQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useGetRolesQuery,
  useGetUsersQuery,
  useGetTeachersQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
  useGetProfileMeQuery,
  useUpdateProfileMeMutation,
  useGetMethodistQuery,
  useGetManagerQuery,
  useGetFinancierQuery,
  useGetProfileRolesTreeQuery
} = userApi;
