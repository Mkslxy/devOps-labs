"use client";

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, Network, RefreshCw, UserRound } from "lucide-react";
import {
    useGetProfileMeQuery,
    useGetProfileRolesTreeQuery,
} from "@/store/users/user.api";
import type { ProfileRolesTreeValue } from "@/store/users/user.type";

const ROLE_LABELS: Record<string, string> = {
    student: "Студент",
    teacher: "Викладач",
    manager: "Менеджер",
    methodologist: "Методист",
    methodist: "Методист",
    financier: "Фінансист",
    director: "Директор",
    tutor: "Тьютор",
};

const SECTION_LABELS: Record<string, string> = {
    manager: "Менеджери",
    methodologist: "Методисти",
    financier: "Фінансисти",
    teacher: "Викладачі",
    director: "Директори",
    tutor: "Тьютори",
    children: "Закріплені працівники",
    users: "Користувачі",
    employees: "Працівники",
    assigned_users: "Закріплені користувачі",
    subordinates: "Підлеглі",
    workers: "Працівники",
};

function ProfileRolesTreeNode({
                                  value,
                                  title,
                                  level = 0,
                              }: {
    value: ProfileRolesTreeValue | unknown;
    title?: string;
    level?: number;
}) {
    if (value === null || value === undefined || value === "") {
        return (
            <div className="rounded-md border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
                Немає
            </div>
        );
    }

    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return (
            <div className="rounded-md border bg-muted/20 p-3 text-sm">
                {title && (
                    <span className="text-muted-foreground">
                        {SECTION_LABELS[title] || title}:{" "}
                    </span>
                )}
                <span>{String(value)}</span>
            </div>
        );
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return (
                <div className="rounded-md border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
                    Немає
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {value.map((item, index) => (
                    <ProfileRolesTreeNode
                        key={index}
                        value={item}
                        level={level}
                    />
                ))}
            </div>
        );
    }

    if (typeof value === "object") {
        const person = value as Record<string, any>;

        const nestedKeys = [
            "children",
            "users",
            "employees",
            "assigned_users",
            "subordinates",
            "workers",
        ].filter((key) => Array.isArray(person[key]));

        const roleSlug =
            typeof person.role === "object" && person.role
                ? person.role.slug
                : person.role;

        return (
            <Card className={level > 0 ? "ml-2 rounded-md border-primary/10" : "rounded-md border-primary/10"}>
                <CardContent className="space-y-3 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <UserRound className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                                <p className="w-[150px] md:w-[200px] break-all font-medium">
                                    {person.full_name || person.name || person.email || "Немає"}
                                </p>

                                {person.email && (
                                    <p className="break-all text-sm text-muted-foreground">
                                        {person.email}
                                    </p>
                                )}

                                {person.phone_normalized && (
                                    <p className="text-sm text-muted-foreground">
                                        {person.phone_normalized}
                                    </p>
                                )}
                            </div>
                        </div>

                        {roleSlug && (
                            <Badge variant="secondary" className="w-fit shrink-0">
                                {ROLE_LABELS[String(roleSlug)] || String(roleSlug)}
                            </Badge>
                        )}
                    </div>

                    {nestedKeys.map((key) => (
                        <div key={key} className="space-y-2 border-t pt-3">
                            <p className="text-sm font-medium">
                                {SECTION_LABELS[key] || key}
                            </p>

                            <ProfileRolesTreeNode
                                value={person[key]}
                                level={level + 1}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
            <div className="rounded-md border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
            Немає
        </div>
    );
}

export function ProfileRolesTreeCard() {
    const { data: userData } = useGetProfileMeQuery();

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useGetProfileRolesTreeQuery();

    const currentRole = userData?.role?.slug;

    if (currentRole === "student") {
        return null;
    }

    return (
        <Card className="rounded-md">
            <CardHeader className="border-b p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Network className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <CardTitle className="text-base">Робоча структура</CardTitle>
                            <CardDescription className="mt-1">
                                Команда і користувачі, закріплені за профілем
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className="w-fit shrink-0">
                        Структура
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-4">
                {isLoading ? (
                    <div className="flex min-h-[140px] items-center justify-center rounded-md border bg-muted/20">
                        <div className="text-center">
                            <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
                            <p className="mt-2 text-sm text-muted-foreground">
                                Завантаження структури...
                            </p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4">
                        <p className="font-medium text-destructive">
                            Не вдалося завантажити структуру
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Спробуйте оновити дані ще раз.
                        </p>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3 gap-2"
                            onClick={() => refetch()}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Спробувати знову
                        </Button>
                    </div>
                ) : !data || Object.keys(data).length === 0 ? (
                    <div className="rounded-md border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
                        Немає закріплених працівників
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(data).map(([key, value]) => (
                            <div key={key} className="space-y-2 rounded-md border bg-background p-3">
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    {SECTION_LABELS[key] || ROLE_LABELS[key] || key}
                                </p>

                                <ProfileRolesTreeNode value={value} title={key} />
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
