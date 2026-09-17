"use client";

import {useMemo, useState} from "react";
import {
    Users,
    BookOpen,
    ArrowRight,
    ArrowLeft,
    Mail,
    GraduationCap,
} from "lucide-react";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";

import {GradeTable} from "./grade-table";

import type {Group} from "@/store/groups/group.type";
import type {UserResponse} from "@/store/users/user.type";

import {useGetGroupsQuery} from "@/store/groups/group.api";
import {useGetTeachersQuery} from "@/store/users/user.api";

type ViewState =
    | { type: "teachers" }
    | { type: "groups"; teacher: UserResponse }
    | { type: "journal"; teacher: UserResponse; group: Group };

type Paginated<T> = { results?: T[] } | T[];

function pickResults<T>(data: Paginated<T> | undefined): T[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
}

function calcTeacherGroupsMeta(groups: Group[]) {
    const totalStudents = groups.reduce((sum, g) => sum + (g.students?.length ?? 0), 0);
    return {totalStudents};
}

function calcAverageFromGroup(group: Group): string {
    const grades = (group as unknown as { grades?: Array<{ value: number | null | undefined }> }).grades ?? [];
    const valid = grades.filter((g) => g?.value !== null && g?.value !== undefined);

    if (valid.length === 0) return "Немає";

    const sum = valid.reduce((acc, g) => acc + Number(g.value ?? 0), 0);
    const avg = sum / valid.length;

    return Number.isFinite(avg) ? avg.toFixed(1) : "Немає";
}

export function ManagerView() {
    const [viewState, setViewState] = useState<ViewState>({type: "teachers"});

    const {
        data: teachersData,
        isLoading: teachersLoading,
        isError: teachersError,
        refetch: refetchTeachers,
    } = useGetTeachersQuery(
        {
            page: 1,
            page_size: 50,
        } as const
    );

    const teachers = useMemo(
        () => pickResults<UserResponse>(teachersData as Paginated<UserResponse> | undefined),
        [teachersData]
    );

    const selectedTeacher = viewState.type !== "teachers" ? viewState.teacher : null;

    const {
        data: groupsData,
        isLoading: groupsLoading,
        isError: groupsError,
        refetch: refetchGroups,
    } = useGetGroupsQuery(
        selectedTeacher
            ? ({
                teacher: selectedTeacher.id,
                page: 1,
                page_size: 50,
                ordering: "name",
            } as const)
            : (undefined as never),
        {skip: !selectedTeacher}
    );

    const groups = useMemo(
        () => pickResults<Group>(groupsData as Paginated<Group> | undefined),
        [groupsData]
    );

    if (viewState.type === "journal") {
        return (
            <GradeTable
                group={viewState.group}
                editable={false}
                onBack={() => setViewState({type: "groups", teacher: viewState.teacher})}
            />
        );
    }

    if (viewState.type === "groups") {
        const teacher = viewState.teacher;
        const {totalStudents} = calcTeacherGroupsMeta(groups);

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="cursor-pointer"
                        onClick={() => setViewState({type: "teachers"})}
                    >
                        <ArrowLeft className="h-4 w-4"/>
                    </Button>

                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-foreground sm:text-2xl truncate">
                            {teacher.full_name || "Немає"}
                        </h2>
                        <p className="text-sm text-muted-foreground sm:text-base">
                            Обери групу для перегляду журналу
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">

                            <span className="inline-flex items-center gap-1">
                                <Mail className="h-3 w-3"/>
                                <span className="truncate">{teacher.email || "Немає"}</span>
                            </span>

                            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3"/>{totalStudents.toString()} студентів</span>
                            <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3"/>{groups.length.toString()} груп</span>

                        </div>
                    </div>
                </div>
                {(groupsLoading || groupsError) && (
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center justify-between gap-3 py-10">
                            <span className="text-muted-foreground">
                                {groupsLoading ? "Завантаження…" : "Не вдалося завантажити групи."}
                            </span>
                            {groupsError && (
                                <Button variant="outline" className="bg-transparent" onClick={() => refetchGroups()}>
                                    Оновити
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {!groupsLoading && !groupsError && groups.length === 0 && (
                    <Card className="bg-card border-border">
                        <CardContent className="py-10 text-muted-foreground">Немає груп</CardContent>
                    </Card>
                )}

                {!groupsLoading && !groupsError && groups.length > 0 && (
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {groups.map((group) => {
                            const average = calcAverageFromGroup(group);
                            const studentsCount = (group.students?.length ?? 0).toString();

                            return (
                                <Card
                                    key={group.id}
                                    className="bg-card border-border transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer group"
                                    onClick={() => setViewState({type: "journal", teacher, group})}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <CardTitle
                                                    className="truncate text-base text-foreground transition-colors group-hover:text-primary sm:text-lg">
                                                    {group.name || "Немає"}
                                                </CardTitle>
                                            </div>

                                            <div
                                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
                                                <BookOpen className="h-4 w-4 text-primary sm:h-5 sm:w-5"/>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3 sm:space-y-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div
                                                className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                                                <Users className="h-4 w-4"/>
                                                <span>{studentsCount} студентів</span>
                                            </div>

                                            <div className="text-right">
                                                <span
                                                    className="text-[11px] text-muted-foreground sm:text-xs">Сер. бал</span>
                                                <div
                                                    className="text-base font-bold text-primary sm:text-lg">{average}</div>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full cursor-pointer bg-transparent text-xs sm:text-sm sm:px-3 sm:py-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                        >
                                            <span>Відкрити журнал</span>
                                            <ArrowRight className="ml-2 h-4 w-4"/>
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-foreground sm:text-2xl">Викладачі</h2>
                <p className="text-sm text-muted-foreground sm:text-base">
                    Обери викладача для перегляду його груп та журналів
                </p>
            </div>

            {(teachersLoading || teachersError) && (
                <Card className="bg-card border-border">
                    <CardContent className="flex items-center justify-between gap-3 py-10">
            <span className="text-muted-foreground">
              {teachersLoading ? "Завантаження…" : "Не вдалося завантажити викладачів."}
            </span>
                        {teachersError && (
                            <Button variant="outline" className="bg-transparent" onClick={() => refetchTeachers()}>
                                Оновити
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {!teachersLoading && !teachersError && teachers.length === 0 && (
                <Card className="bg-card border-border">
                    <CardContent className="py-10 text-muted-foreground">Немає викладачів</CardContent>
                </Card>
            )}

            {!teachersLoading && !teachersError && teachers.length > 0 && (
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {teachers.map((teacher) => {
                        return (
                            <Card
                                key={teacher.id}
                                className="bg-card border-border transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer group"
                                onClick={() => setViewState({type: "groups", teacher})}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <GraduationCap className="h-6 w-6 text-primary"/>
                                        </div>

                                        <div className="min-w-0">
                                            <CardTitle
                                                className="text-base text-foreground group-hover:text-primary transition-colors truncate">
                                                {teacher.full_name || "Немає"}
                                            </CardTitle>

                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                <Mail className="h-3 w-3"/>
                                                <span className="truncate">{teacher.email || "Немає"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <Button
                                        variant="outline"
                                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-transparent"
                                    >
                                        <span>Переглянути групи</span>
                                        <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
