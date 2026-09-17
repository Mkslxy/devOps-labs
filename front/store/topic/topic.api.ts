import {baseApi} from "@/store/baseApi";
import type {Topic, TopicPayload, TopicResponse} from "@/store/topic/topic.type";
import {BaseQueryArg} from "@reduxjs/toolkit/query";
import {Group, GroupPayload} from "@/store/groups/group.type";

export const topicApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTopics: builder.query<
            TopicResponse,
            { page?: number; page_size?: number; ordering?: string; }
        >({
            query: (params) => ({
                url: "/topic/",
                params,
            }),
            providesTags: [{type: "Topic", id: "LIST"}],
        }),

        getTopicById: builder.query<Topic, number>({
            query: (id) => `/topic/${id}/`,
            providesTags: (_r, _e, id) => [{type: "Topic", id}],
        }),

        createTopic: builder.mutation<Topic, TopicPayload>({
            query: (body) => ({
                url: "/topic/",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Topic"],
        }),
        updateTopic: builder.mutation<
            Topic,
            { id: number; data: TopicPayload }
        >({
            query: ({id, data}) => ({
                url: `/topic/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (_r, _e, {id}) => [
                {type: "Topic", id},
                {type: "Topic", id: "LIST"},
            ],
        }),

        deleteTopic: builder.mutation<void, number>({
            query: (id) => ({
                url: `/topic/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, id) => [
                {type: "Topic", id},
                {type: "Topic", id: "LIST"},
            ],
        }),

    }),
});

export const {
    useGetTopicsQuery,
    useGetTopicByIdQuery,
    useCreateTopicMutation,
    useUpdateTopicMutation,
    useDeleteTopicMutation
} = topicApi;
