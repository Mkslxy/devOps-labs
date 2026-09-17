import { baseApi } from "@/store/baseApi";
import { toFormData } from "@/libs/formdata";
import {
    MagicTestPayload,
    MagicTestResponse,
} from "@/store/magic-import/magic-test.type";

export const magicTestApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        importMagicTest: builder.mutation<MagicTestResponse, MagicTestPayload>({
            query: (data) => ({
                url: "/magic-import/test-import/",
                method: "POST",
                body: toFormData(data),
            }),
        }),
    }),
});

export const { useImportMagicTestMutation } = magicTestApi;