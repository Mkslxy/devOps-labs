"use client";

import { useMemo, useState } from "react";
import { Users, BookOpen, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { GradeTable } from "./grade-table";

import { useGetGroupsQuery } from "@/store/groups/group.api";
import { useGetProfileMeQuery } from "@/store/users/user.api";

import type { Group } from "@/store/groups/group.type";
import type { UserFormData } from "@/store/users/user.type";

interface TeacherViewProps {
    user?: UserFormData;
}

type Paginated<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function isPaginated<T>(v: unknown): v is Paginated<T> {
    return isObject(v) && Array.isArray(v.results);
}

function pickResults<T>(data: unknown): T[] {
    if (!data) return [];
    if (Array.isArray(data)) return data as T[];
    if (isPaginated<T>(data)) return data.results;
    return [];
}

function pickMe(data: unknown): UserFormData | null {
    if (!data) return null;

    if (isPaginated<UserFormData>(data)) {
        return data.results[0] ?? null;
    }

    if (isObject(data) && typeof data.full_name === "string") {
        return data as unknown as UserFormData;
    }

    return null;
}

function getStudentsCount(group: Group): number {
    const students = (group as unknown as { students?: unknown }).students;
    return Array.isArray(students) ? students.length : 0;
}

export function TeacherView(_props: TeacherViewProps) {
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    const { data: meData, isLoading: meLoading, isError: meIsError } = useGetProfileMeQuery();
    const me = useMemo(() => pickMe(meData), [meData]);

    const teacherId = me?.id;

    const {
        data: groupsData,
        isLoading: groupsLoading,
        isError: groupsIsError,
        refetch,
    } = useGetGroupsQuery(
        {
            teacher: teacherId ?? 0,
            page: 1,
            page_size: 50,
            ordering: "name",
        },
        { skip: !teacherId }
    );

    const groups = useMemo(() => pickResults<Group>(groupsData), [groupsData]);

    if (selectedGroup) {
        return <GradeTable group={selectedGroup} editable={true} onBack={() => setSelectedGroup(null)} />;
    }

    if (meLoading || groupsLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Мої групи</h2>
                    <p className="text-muted-foreground">Завантаження…</p>
                </div>

                <Card className="bg-card border-border">
                    <CardContent className="py-10 text-muted-foreground">Завантаження списку груп…</CardContent>
                </Card>
            </div>
        );
    }

    if (meIsError || groupsIsError) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Мої групи</h2>
                    <p className="text-muted-foreground">Не вдалося завантажити дані.</p>
                </div>

                <Card className="bg-card border-border">
                    <CardContent className="flex items-center justify-between gap-3 py-10">
                        <span className="text-muted-foreground">Спробуй оновити.</span>
                        <Button variant="outline" className="bg-transparent" onClick={() => refetch()}>
                            Оновити
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-foreground sm:text-2xl">Мої групи</h2>
                <p className="text-sm text-muted-foreground sm:text-base">Обери групу для перегляду та редагування журналу</p>
            </div>

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => {
                    const studentsCount = getStudentsCount(group);

                    return (
                        <Card
                            key={group.id}
                            className="bg-card border-border transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer group"
                            onClick={() => setSelectedGroup(group)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <CardTitle className="truncate text-base text-foreground transition-colors group-hover:text-primary sm:text-lg">
                                            {group.name ?? "Немає"}
                                        </CardTitle>
                                    </div>

                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
                                        <BookOpen className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3 sm:space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                                        <Users className="h-4 w-4" />
                                        <span>{studentsCount} студентів</span>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-[11px] text-muted-foreground sm:text-xs">Журнал</span>
                                        <div className="text-base font-bold text-primary sm:text-lg">Відкрити</div>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full cursor-pointer bg-transparent text-xs sm:text-sm sm:px-3 sm:py-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                >
                                    <span>Відкрити журнал</span>
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {groups.length === 0 && (
                <Card className="bg-card border-border">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground">Немає груп</h3>
                        <p className="text-sm text-muted-foreground mt-1">Тобі ще не призначили групи</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
