"use client";

import React, { useMemo, useState } from "react";
import { BookOpen, TrendingUp, Award, Calendar } from "lucide-react";

import { cn } from "@/libs/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { UserResponse } from "@/store/users/user.type";
import type { Group } from "@/store/groups/group.type";

import { useGetGroupsQuery } from "@/store/groups/group.api";
import {useGetGradeBookAttendanceQuery, useGetGradebookGridQuery} from "@/store/gradebook/gradebook.api";
import {
    GradeBookAttendance,
    GradeBookAttendanceCategory,
    GradebookGridCell,
    GradebookGridGradeItem
} from "@/store/gradebook/gradebook.type";

function getGradeColor(value: number | null): string {
    if (value === null) return "";
    if (value >= 9) return "bg-primary/20 text-primary";
    if (value >= 7) return "bg-chart-3/20 text-chart-3";
    if (value >= 5) return "bg-warning/20 text-warning";
    return "bg-destructive/20 text-destructive";
}

function getLatestGradeFromCell(cell?: GradebookGridCell): GradebookGridGradeItem | null {
    if (!cell?.grades?.length) return null;
    return cell.grades[cell.grades.length - 1] ?? null;
}

type Paginated<T> = { results?: T[] } | T[];

function pickResults<T>(data: Paginated<T> | undefined): T[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
}

interface StudentViewProps {
    user: UserResponse;
}

export function StudentView({ user }: StudentViewProps) {
    const studentId = user.id;

    const {
        data: groupsData,
        isLoading: groupsLoading,
        isError: groupsError,
        refetch: refetchGroups,
    } = useGetGroupsQuery({page: 1, page_size: 50, ordering: "name" } as const);

    const groups = useMemo(
        () => pickResults<Group>(groupsData as Paginated<Group> | undefined),
        [groupsData]
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground">
                    Привіт, {user.full_name.split(" ")[1] || "Немає"}!
                </h2>
                <p className="text-muted-foreground">Тут ти можеш переглянути свої оцінки по всіх групах</p>
            </div>

            {(groupsLoading || groupsError) && (
                <Card className="border-border bg-card">
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
                <Card className="border-border bg-card">
                    <CardContent className="py-10 text-muted-foreground">Немає груп</CardContent>
                </Card>
            )}

            {!groupsLoading && !groupsError && groups.length > 0 && (
                <StudentGradesDashboard studentId={studentId} groups={groups} />
            )}
        </div>
    );
}

function StudentGradesDashboard({
                                    studentId,
                                    groups,
                                }: {
    studentId: number;
    groups: Group[];
}) {
    const grids = groups.map((g) => {
        const q = useGetGradebookGridQuery({ group_id: g.id }, { skip: !g.id });
        return { group: g, ...q };
    });

    const overall = useMemo(() => {
        const allValues: number[] = [];
        let subjects = 0;

        for (const item of grids) {
            const grid = item.data;
            if (!grid?.columns?.length) continue;

            let hasAny = false;

            for (const col of grid.columns) {
                const key = `${studentId}_${col.id}`;
                const cell = grid.cells?.[key];
                const latest = getLatestGradeFromCell(cell);
                const v = latest?.value;

                if (typeof v === "number" && Number.isFinite(v)) {
                    allValues.push(v);
                    hasAny = true;
                }
            }

            if (hasAny) subjects += 1;
        }

        if (!allValues.length) return { avg: "Немає", best: "Немає", subjects: 0 };

        const sum = allValues.reduce((a, b) => a + b, 0);
        const avg = (sum / allValues.length).toFixed(1);
        const best = Math.max(...allValues).toString();

        return { avg, best, subjects };
    }, [grids, studentId]);

    return (
        <>
            <div className="flex flex-col md:flex-row gap-5">
                <Card className="border-border bg-card w-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Сер. бал</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{overall.avg}</div>
                        <p className="text-xs text-muted-foreground">за всі групи</p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card w-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Груп</CardTitle>
                        <BookOpen className="h-4 w-4 text-chart-3" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{overall.subjects || groups.length}</div>
                        <p className="text-xs text-muted-foreground">активних груп</p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card w-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Найкраща оцінка</CardTitle>
                        <Award className="h-4 w-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{overall.best}</div>
                        <p className="text-xs text-muted-foreground">за весь час</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                {grids.map(({ group, data, isLoading, isError }) => (
                    <StudentGroupJournal
                        key={group.id}
                        group={group}
                        studentId={studentId}
                        grid={data}
                        isLoading={isLoading}
                        isError={isError}
                    />
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <svg width="10" height="10" viewBox="0 0 12 12" className="fill-foreground">
                        <polygon points="12,0 12,12 0,0" />
                    </svg>
                    <span>є коментар (натисни щоб переглянути)</span>
                </div>
            </div>
        </>
    );
}

function StudentGroupJournal({
                                 group,
                                 studentId,
                                 grid,
                                 isLoading,
                                 isError,
                             }: {
    group: Group;
    studentId: number;
    grid:
        | { columns?: Array<{ id: number; title?: string | null; date?: string | null }>; cells?: Record<string, GradebookGridCell> }
        | undefined;
    isLoading: boolean;
    isError: boolean;
}) {
    const columns = useMemo(() => grid?.columns ?? [], [grid]);

    const { data: attendanceResp } = useGetGradeBookAttendanceQuery(
        { group: group.id, page_size: 1000, ordering: "created_at" },
        { skip: !group.id }
    );

    const attendanceByCellKey = useMemo(() => {
        const map: Record<string, GradeBookAttendance> = {};
        const list = attendanceResp?.results ?? [];

        for (const a of list) {
            const k = `${a.student}_${a.column}`;
            map[k] = a;
        }

        return map;
    }, [attendanceResp]);

    const getAttendanceCategory = (columnId: number) => {
        const k = `${studentId}_${columnId}`;
        return attendanceByCellKey[k]?.category ?? null;
    };

    const values = useMemo(() => {
        if (!grid || !columns.length) return [];
        const vals: number[] = [];

        for (const col of columns) {
            const key = `${studentId}_${col.id}`;
            const cell = grid.cells?.[key];
            const latest = getLatestGradeFromCell(cell);
            const v = latest?.value;
            if (typeof v === "number" && Number.isFinite(v)) vals.push(v);
        }

        return vals;
    }, [grid, columns, studentId]);

    const average = useMemo(() => {
        if (!values.length) return "Немає";
        const sum = values.reduce((a, b) => a + b, 0);
        return (sum / values.length).toFixed(1);
    }, [values]);

    const [openCell, setOpenCell] = useState<{ columnId: number } | null>(null);
    const [commentValue, setCommentValue] = useState<string>("");

    const closeCommentPopover = () => {
        setOpenCell(null);
        setCommentValue("");
    };

    return (
        <Card className="overflow-hidden border-border bg-card">
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <CardTitle className="truncate text-lg text-foreground">
                            Група {group.name || "Немає"}
                        </CardTitle>
                    </div>

                    <div className="text-right">
                        <div
                            className={cn(
                                "inline-flex items-center rounded-lg px-3 py-1.5 text-lg font-bold",
                                getGradeColor(Number.parseFloat(average) || null)
                            )}
                        >
                            {average}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">середній бал</p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-4">
                {isLoading && <div className="text-sm text-muted-foreground">Завантаження…</div>}
                {isError && <div className="text-sm text-muted-foreground">Не вдалося завантажити журнал.</div>}

                {!isLoading && !isError && (
                    <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
                        <div className="flex w-full overflow-hidden rounded-lg border border-border">
                            <div className="shrink-0 border-r border-border">
                                <table className="border-collapse h-full">
                                    <thead>
                                    <tr className="border-b border-border bg-card h-12">
                                        <th className="min-w-[120px] sm:min-w-[160px] px-0 text-left text-xs font-medium text-muted-foreground">
                                            <div className="flex h-12 items-center px-0 pl-2">
                                            </div>
                                        </th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    <tr className="h-12 sm:h-14">
                                        <td className="px-0 text-sm font-medium text-foreground border-b border-border">
                                            <div className="flex h-12 sm:h-14 items-center px-2">
                                                Оцінка
                                            </div>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="min-w-0 flex-1 overflow-x-auto touch-pan-x overscroll-x-contain">
                                <table className="w-full border-collapse h-full">
                                    <thead>
                                    <tr className="border-b border-border bg-card h-12">
                                        {columns.length === 0 ? (
                                            <th className="min-w-[200px] px-0 text-center text-xs text-muted-foreground">
                                                <div className="flex h-12 items-center justify-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    Немає оцінок
                                                </div>
                                            </th>
                                        ) : (
                                            columns.map((col) => (
                                                <th key={col.id} className="min-w-[60px] px-0 text-center">
                                                    <div className="flex h-12 items-center justify-center">
                                                        <span className="text-xs font-medium text-foreground w-[120px]">
                                                            {col.date || col.title || "Немає"}
                                                        </span>
                                                    </div>
                                                </th>
                                            ))
                                        )}
                                    </tr>
                                    </thead>

                                    <tbody>
                                    <tr className="h-12 sm:h-14">
                                        {columns.length === 0 ? (
                                            <td className="px-0 text-center text-sm text-muted-foreground border-b border-border">
                                                <div className="flex h-12 sm:h-14 items-center justify-center">
                                                    Немає
                                                </div>
                                            </td>
                                        ) : (
                                            columns.map((col) => {
                                                const key = `${studentId}_${col.id}`;
                                                const cell = grid?.cells?.[key];
                                                const latest = getLatestGradeFromCell(cell);
                                                const hasComment = !!latest?.comment;

                                                const cat = getAttendanceCategory(col.id);

                                                const displayValue = (() => {
                                                    if (cat === GradeBookAttendanceCategory.absent) return "н";
                                                    if (typeof latest?.value === "number") return latest.value;
                                                    return "-";
                                                })();

                                                const cellColor = getGradeColor(
                                                    cat === GradeBookAttendanceCategory.absent ? null : (latest?.value ?? null)
                                                );

                                                const isOpen = !!openCell && openCell.columnId === col.id;

                                                return (
                                                    <td key={col.id} className="px-0 text-center border-b border-border">
                                                        <div className="flex h-12 sm:h-14 items-center justify-center">
                                                            <Popover
                                                                open={isOpen}
                                                                onOpenChange={(open) => {
                                                                    if (!open) closeCommentPopover();
                                                                }}
                                                            >
                                                                <PopoverTrigger asChild>
                                                                    <div
                                                                        className={cn(
                                                                            "relative mx-auto flex h-8 w-10 items-center justify-center rounded-md text-sm font-medium",
                                                                            cellColor,
                                                                            (latest?.value === null || latest?.value === undefined) && "text-muted-foreground/50"
                                                                        )}
                                                                        onClick={(e) => {
                                                                            const target = e.target as HTMLElement;
                                                                            const clickedCommentBtn = !!target.closest("[data-comment-btn]");

                                                                            if (!clickedCommentBtn) return;
                                                                            if (!latest?.comment) return;

                                                                            setOpenCell({ columnId: col.id });
                                                                            setCommentValue(latest.comment);
                                                                        }}
                                                                    >
                                                                        {displayValue}

                                                                        {hasComment && (
                                                                            <button
                                                                                type="button"
                                                                                data-comment-btn
                                                                                className="absolute top-0 right-0 cursor-pointer"
                                                                                onClick={() => {}}
                                                                            >
                                                                                <svg
                                                                                    width="12"
                                                                                    height="12"
                                                                                    viewBox="0 0 12 12"
                                                                                    className="fill-foreground"
                                                                                >
                                                                                    <polygon points="12,0 12,12 0,0" />
                                                                                </svg>
                                                                            </button>
                                                                        )}


                                                                    </div>
                                                                </PopoverTrigger>

                                                                <PopoverContent
                                                                    className="w-72 sm:w-80"
                                                                    align="end"
                                                                    side="right"
                                                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                                                >
                                                                    <div className="space-y-2">
                                                                        <p className="text-sm font-medium text-foreground">
                                                                            Коментар викладача
                                                                        </p>
                                                                        <p className="text-sm text-foreground">
                                                                            {commentValue || "Немає"}
                                                                        </p>

                                                                        <div className="flex justify-end pt-1">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="cursor-pointer"
                                                                                onClick={closeCommentPopover}
                                                                            >
                                                                                Закрити
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                    </td>
                                                );
                                            })
                                        )}
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
