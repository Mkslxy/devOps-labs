"use client";

import { baseApi } from "@/store/baseApi";
import { toFormData } from "@/libs/formdata";
import type { Training, TrainingPayload, TrainingResponse, TrainingListParams } from "./training.type";

export const trainingApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTrainings: builder.query<TrainingResponse, TrainingListParams | void>({
            query: (params) => ({
                url: "/trainings/",
                method: "GET",
                params: params ?? undefined,
            }),
            providesTags: (res) =>
                res?.results
                    ? [
                        { type: "Trainings", id: "LIST" },
                        ...res.results.map((t) => ({ type: "Trainings" as const, id: t.id })),
                    ]
                    : [{ type: "Trainings", id: "LIST" }],
        }),

        getTrainingById: builder.query<Training, { id: number }>({
            query: ({ id }) => ({
                url: `/trainings/${id}/`,
                method: "GET",
            }),
            providesTags: (_res, _err, arg) => [{ type: "Trainings", id: arg.id }],
        }),

        createTraining: builder.mutation<Training, TrainingPayload>({
            query: (data) => ({
                url: "/trainings/",
                method: "POST",
                body: toFormData(data),
            }),
            invalidatesTags: [{ type: "Trainings", id: "LIST" }],
        }),

        updateTraining: builder.mutation<Training, { id: number; data: Partial<TrainingPayload> }>({
            query: ({ id, data }) => ({
                url: `/trainings/${id}/`,
                method: "PATCH",
                body: toFormData(data),
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "Trainings", id: "LIST" },
                { type: "Trainings", id: arg.id },
            ],
        }),

        deleteTraining: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `/trainings/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "Trainings", id: "LIST" },
                { type: "Trainings", id: arg.id },
            ],
        }),
    }),
});

export const {
    useGetTrainingsQuery,
    useGetTrainingByIdQuery,
    useCreateTrainingMutation,
    useUpdateTrainingMutation,
    useDeleteTrainingMutation,
} = trainingApi;
