import { Color } from "./google.type";
import {baseApi} from "@/store/baseApi";
export const googleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    googleConnect: builder.query<{ url: string }, void>({
      query: () => "google/connect/",
    }),
    googleCallBack: builder.mutation<void, { code: string }>({
      query: (code) => ({
        url: "google/callback/",
        method: "POST",
        body: code,
        invalidatesTags: ["GoogleStatus"],
      }),
    }),
    googleColors: builder.query<Color[], void>({
      query: () => "google/colors/",
    }),
  }),
});

export const {
  useGoogleConnectQuery,
  useLazyGoogleConnectQuery,
  useGoogleCallBackMutation,
  useGoogleColorsQuery,
} = googleApi;
