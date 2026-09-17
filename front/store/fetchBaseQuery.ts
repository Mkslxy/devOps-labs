import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

const base = fetchBaseQuery({
  baseUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/`,
  credentials: "include",
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await base(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refresh = await base(
      {
        url: "auth/refresh/",
        method: "POST",
      },
      api,
      extraOptions
    );

    if (refresh.data) {
      result = await base(args, api, extraOptions);
    } else {
      if (typeof window !== "undefined") window.location.href = "/";
    }
  }

  return result;
};
