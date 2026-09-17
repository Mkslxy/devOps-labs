"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useGetProfileMeQuery } from "@/store/users/user.api";

import type { UserResponse } from "@/store/users/user.type";
import { ManagerView } from "@/components/gradebook/manager-view";

function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

type Paginated<T> = { results?: T[] } | T[];

function pickFirst<T>(data: Paginated<T> | undefined): T | null {
    if (!data) return null;
    if (Array.isArray(data)) return data[0] ?? null;
    if (isObject(data) && Array.isArray((data as { results?: T[] }).results)) {
        return (data as { results: T[] }).results[0] ?? null;
    }
    return data as T;
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
        Array.isArray((v as { permissions?: unknown }).permissions) &&
        Array.isArray((v as { groups?: unknown }).groups) &&
        isRole((v as { role?: unknown }).role)
    );
}

export default function JournalPage() {
    const { data: meData, isLoading, isError, refetch } = useGetProfileMeQuery();

    const raw = pickFirst<UserResponse>(meData as Paginated<UserResponse> | undefined);
    const me = isUserResponse(raw) ? raw : null;

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
                    <CardContent className="flex items-center justify-between gap-3 py-10">
                        <span className="text-muted-foreground">Не вдалося завантажити профіль.</span>
                        <button
                            className="text-sm underline"
                            type="button"
                            onClick={() => refetch()}
                        >
                            Оновити
                        </button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    if (!["manager", "admin", "director", "methodist", "financier", "tutor"].includes(me.role.slug)) {
        return (
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <Card className="bg-card border-border">
                    <CardContent className="py-10 text-muted-foreground">Немає доступу.</CardContent>
                </Card>
            </main>
        );
    }

    return (
        <div className="min-h-screen">
                <ManagerView />
        </div>
    );
}
