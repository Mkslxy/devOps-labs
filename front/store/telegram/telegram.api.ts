import { baseApi } from "@/store/baseApi";
import { appendFd, toFormData } from "@/libs/formdata";
import {TelegramBroadCastingPayload, TelegramStartLink} from "@/store/telegram/telegram.type";

export const telegramApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTelegramStartLink: builder.query<TelegramStartLink, void>({
            query: () => ({
                url: "/telegram/start-link/",
                method: "GET",
            }),
        }),

        sendTelegramBroadcasting: builder.mutation<void, TelegramBroadCastingPayload>({
            query: (data) => {
                const fd = toFormData(data, {
                    omit: ["files", "roles", "groups", "users"],
                });

                data.files?.forEach((file) => {
                    fd.append("files", file);
                });

                data.roles?.forEach((role) => {
                    appendFd(fd, "roles", role);
                });

                data.groups?.forEach((groupId) => {
                    appendFd(fd, "groups", groupId);
                });

                data.users?.forEach((userId) => {
                    appendFd(fd, "users", userId);
                });

                return {
                    url: "/telegram/broadcasting/",
                    method: "POST",
                    body: fd,
                };
            },
        }),
    }),
});

export const {
    useGetTelegramStartLinkQuery,
    useSendTelegramBroadcastingMutation,
} = telegramApi;