import { baseApi } from "@/store/baseApi";
import {
    CreateInvoicePayload,
    CreateInvoiceResponse,
    CreateTopUpInvoicePayload,
} from "./finance.type";

export const paymentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createInvoice: builder.mutation<
            CreateInvoiceResponse,
            CreateInvoicePayload
        >({
            query: (body) => ({
                url: "/payments/create-invoice/",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Payment"],
        }),
        createTopUpInvoice: builder.mutation<
            CreateInvoiceResponse,
            CreateTopUpInvoicePayload
        >({
            query: (body) => ({
                url: "/payments/create-top-up-invoice/",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Payment", "StudentSubscription"],
        }),
    }),
});

export const {
    useCreateInvoiceMutation,
    useCreateTopUpInvoiceMutation,
} = paymentApi;
