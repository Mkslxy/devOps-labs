import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  UserRequestRegister,
  UserResponse,
  UserResponseLogin,
} from "./users/user.type";

export const publicApi = createApi({
  reducerPath: "api/public",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/`,
    credentials: "include",
  }),
  endpoints: (build) => ({
    registerUser: build.mutation<UserResponse, UserRequestRegister>({
      query: (user) => ({
        url: "auth/register/",
        method: "POST",
        body: user,
      }),
    }),
    loginUser: build.mutation<
      UserResponseLogin,
      { email: string; password: string }
    >({
      query: (user) => ({
        url: "auth/login/",
        method: "POST",
        body: user,
      }),
    }),
    sendCode: build.mutation<{ email: string }, { email: string }>({
      query: (user) => ({
        url: "verify/email/send-code/",
        method: "POST",
        body: user,
      }),
    }),
    verifyEmailWithCode: build.mutation<
      { verification_token: string },
      { email: string; code: string }
    >({
      query: (user) => ({
        url: "verify/email/",
        method: "POST",
        body: user,
      }),
    }),
    logoutUser: build.mutation<void, void>({
      query: () => ({
        url: "auth/logout/",
        method: "POST",
      }),
    }),
    resetSendCode: build.mutation<void, {email : string}>({
      query: (user) => ({
        url: "restore/send-code/",
        method: "POST",
        body: user,
      }),
    }),
    resetCheckCode: build.mutation<void, {email: string; code: string}>({
      query: (user) => ({
        url: "restore/check-code/",
        method: "POST",
        body: user,
      }),
    }),
    resetPassword: build.mutation<void, {email: string; code: string; password: string; repeat_password: string;}>({
      query: (user) => ({
        url: "restore/reset-password/",
        method: "POST",
        body: user,
      }),
    }),
  }),
});

export const {
  useResetPasswordMutation,
  useResetCheckCodeMutation,
  useResetSendCodeMutation,
  useRegisterUserMutation,
  useLoginUserMutation,
  useSendCodeMutation,
  useVerifyEmailWithCodeMutation,
  useLogoutUserMutation,
} = publicApi;
