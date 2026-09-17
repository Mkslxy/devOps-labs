import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { publicApi } from "./public.api";

import authReducer from "./users/auth.slice";
import {baseApi} from "@/store/baseApi";
const rootReducer = combineReducers({
  [publicApi.reducerPath]: publicApi.reducer,

  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
      .concat(publicApi.middleware)
      .concat(baseApi.middleware)

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
