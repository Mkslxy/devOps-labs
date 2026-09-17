import {
    GroupResponse,
    Group,
    GroupPayload,
    CourseResponse,
    Course,
    CoursePayload,
    GroupListParams
} from "@/store/groups/group.type";
import {baseApi} from "@/store/baseApi";

export const groupApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getGroups: builder.query<
            GroupResponse,
            GroupListParams
        >({
            query: (params) => ({
                url: "/groups/",
                params,
            }),
            providesTags: [
                { type: "Group", id: "LIST" }
            ]
        }),
        getGroupById: builder.query<Group, number>({
            query: (id) => `/groups/${id}/`,
            providesTags: (_r,_e,id)=>[
                {type: "Group", id},
            ]
        }),
        createGroup: builder.mutation<Group, GroupPayload>({
            query: (body) => ({
                url: "/groups/",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Group"],
        }),

        updateGroup: builder.mutation<
            Group,
            { id: number; data: GroupPayload }
        >({
            query: ({ id, data }) => ({
                url: `/groups/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_r, _e, { id }) => [
                {type: "Group", id},
                {type: "Group" , id:"LIST"},
            ],
        }),

        deleteGroup: builder.mutation<void, number>({
            query: (id) => ({
                url: `/groups/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, id) => [
                { type: "Group", id },
                { type: "Group", id: "LIST" },
            ],
        }),
        getCourses: builder.query<
            CourseResponse,
            {
                page?: number;
                page_size?: number;
                ordering?: string;
            }
        >({
            query: (params) => ({
                url: "/course/",
                params,
            }),
            providesTags: [
                { type: "Course", id: "LIST" }
            ]
        }),
        createCourse: builder.mutation<Course, CoursePayload>({
            query: (body) => ({
                url: "/course/",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Course"],
        }),

        updateCourse: builder.mutation<
            Course,
            { id: number; data: CoursePayload }
        >({
            query: ({ id, data }) => ({
                url: `/course/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_r, _e, { id }) => [
                {type: "Course", id},
                {type: "Course" , id:"LIST"},
                {type: "Group" , id:"LIST"},
            ],
        }),

        deleteCourse: builder.mutation<void, number>({
            query: (id) => ({
                url: `/course/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, id) => [
                { type: "Course", id },
                { type: "Course", id: "LIST" },
                {type: "Group" , id:"LIST"},
            ],
        }),
    }),
});

export const {
    useLazyGetCoursesQuery,
    useGetCoursesQuery,
    useCreateCourseMutation,
    useUpdateCourseMutation,
    useDeleteCourseMutation,
    useGetGroupByIdQuery,
    useGetGroupsQuery,
    useCreateGroupMutation,
    useUpdateGroupMutation,
    useDeleteGroupMutation,
} = groupApi;
