"use client";

import { TeacherView } from "@/components/gradebook/teacher-view";
import { Card, CardContent } from "@/components/ui/card";

import { useGetProfileMeQuery } from "@/store/users/user.api";
import type { UserResponse } from "@/store/users/user.type";

function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function isRole(v: unknown): v is UserResponse["role"] {
    if (!isObject(v)) return false;
    return typeof v.id === "number" && typeof v.slug === "string" && typeof v.name === "string";
}

function isUserResponse(v: unknown): v is UserResponse {
    if (!isObject(v)) return false;

    return (
        typeof v.id === "number" &&
        typeof v.email === "string" &&
        typeof v.full_name === "string" &&
        typeof v.phone_country_code === "string" &&
        typeof v.phone_national_number === "string" &&
        typeof v.phone_normalized === "string" &&
        typeof v.date_of_birth === "string" &&
        Array.isArray(v.permissions) &&
        Array.isArray(v.groups) &&
        isRole(v.role)
    );
}

type Paginated<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

function isPaginatedUserResponse(v: unknown): v is Paginated<UserResponse> {
    if (!isObject(v)) return false;
    if (!Array.isArray(v.results)) return false;
    return v.results.every(isUserResponse);
}

function pickMe(data: unknown): UserResponse | null {
    if (isUserResponse(data)) return data;
    if (isPaginatedUserResponse(data)) return data.results[0] ?? null;
    return null;
}

export default function JournalPage() {
    const { data, isLoading, isError } = useGetProfileMeQuery();

    const me = pickMe(data);

    if (isLoading) {
        return (
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <Card className="bg-card border-border">
                    <CardContent className="py-10 text-muted-foreground">Завантаження…</CardContent>
                </Card>
            </main>
        );
    }

    if (isError || !me) {
        return (
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <Card className="bg-card border-border">
                    <CardContent className="py-10 text-muted-foreground">Не вдалося завантажити профіль.</CardContent>
                </Card>
            </main>
        );
    }

    if (me.role.slug !== "teacher") {
        {
            return (
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <Card className="bg-card border-border">
                        <CardContent className="py-10 text-muted-foreground">Немає доступу.</CardContent>
                    </Card>
                </main>
            );
        }


    }

    return (
        <div className="min-h-screen">
            <main className="mx-auto">
                <TeacherView />
            </main>
        </div>
    );
}
