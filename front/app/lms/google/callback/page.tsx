"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGoogleCallBackMutation } from "@/store/google/google.api";
import { useGetProfileMeQuery } from "@/store/users/user.api";

function GoogleCallbackLoader() {
    return (
        <div className="flex h-full min-h-[300px] items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-600">Підключаємо Google Calendar…</span>
        </div>
    );
}

function GoogleCallbackContent() {
    const router = useRouter();
    const sp = useSearchParams();
    const code = sp.get("code");

    const [sendCode] = useGoogleCallBackMutation();
    const { refetch } = useGetProfileMeQuery();

    const ranRef = useRef(false);

    useEffect(() => {
        if (!code) return;
        if (ranRef.current) return;
        ranRef.current = true;

        const run = async () => {
            try {
                await sendCode({ code }).unwrap();

                const fresh = await refetch().unwrap();
                const role = fresh?.role?.slug;

                if (role === "teacher") router.replace("/lms/teacher/calendar");
                else if (role === "manager" || role === "admin") router.replace("/dashboard/manager/calendar");
                else if (role === "student") router.replace("/lms/student/calendar");
                else router.replace("/dashboard/methodist/calendar");
            } catch (e) {
                console.error("Google callback error", e);
                router.replace("/lms/student/calendar");
            }
        };

        run();
    }, [code, sendCode, router, refetch]);

    return <GoogleCallbackLoader />;
}

export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={<GoogleCallbackLoader />}>
            <GoogleCallbackContent />
        </Suspense>
    );
}
