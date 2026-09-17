import type React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import ReduxProvider from "@/components/providers/redux-provider";
import { FormValidationProvider } from "@/components/providers/form-validation-provider";
import { AutoTranslate } from "@/components/i18n/auto-translate";
import { I18nProvider } from "@/components/providers/i18n-provider";
import "react-datepicker/dist/react-datepicker.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
type LayoutLanguage = "uk" | "en";

function isLayoutLanguage(value: string | undefined): value is LayoutLanguage {
  return value === "uk" || value === "en";
}

export const metadata: Metadata = {
  title: "UniSchool - Вивчайте мови онлайн",
  description:
    "Професійна онлайн школа іноземних мов. Вивчайте англійську, німецьку, французьку та інші мови з досвідченими викладачами.",
  generator: "v0.app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get("unischool-language")?.value;
  const initialLanguage = isLayoutLanguage(cookieLanguage) ? cookieLanguage : "uk";

  return (
    <html lang={initialLanguage}>
      <body className={`font-sans antialiased`}>
        <I18nProvider initialLanguage={initialLanguage}>
          <ReduxProvider>
            <FormValidationProvider />
            <AutoTranslate />
            {children}
            <Toaster />
          </ReduxProvider>
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
