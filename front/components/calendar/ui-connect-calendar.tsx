"use client";

import { Button } from "@/components/ui/button";
import { useLazyGoogleConnectQuery } from "@/store/google/google.api";

export default function UIConnectCalendar() {
    const [connect] = useLazyGoogleConnectQuery();

    return (
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 text-center">
                У вас ще не підключений календар
            </h2>

            <p className="text-gray-600 text-center">
                Підключіть Google Calendar, щоб бачити ваш розклад
            </p>

            <Button
                onClick={async () => {
                    const res = await connect().unwrap();
                    window.location.href = res.url;
                }}
            >
                Підключити календар
            </Button>
        </div>
    );
}
