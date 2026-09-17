"use client";

import { useGetProfileMeQuery } from "@/store/users/user.api";
import { Calendar } from "./calendar";
import UIConnectCalendar from "./ui-connect-calendar";

export default function CalendarGate() {
  const {
    data: profileData,
    isLoading: loadingProfileData,
    error: errorProfileData,
  } = useGetProfileMeQuery();

  if (loadingProfileData) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

        <p className="text-gray-600 text-lg">Завантаження...</p>
      </div>
    );
  }

  if (errorProfileData) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4">
        <p className="text-red-600 text-lg font-medium text-center">
          Сталася помилка при завантаженні.
        </p>
      </div>
    );
  }

  if (!profileData?.is_google_calendar_connected) {
    return <UIConnectCalendar />;
  }

  return <Calendar />;
}
