"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { skipToken } from "@reduxjs/toolkit/query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { CalendarDays, CheckCircle2, MessageSquareText, Upload, ArrowRight } from "lucide-react";

import { DashboardHeaderCard } from "@/components/lms/student-homework/ui/dashboard-header-card";
import { EmptyCard } from "@/components/lms/student-homework/ui/empty-card";
import { DeadlineBadge } from "@/components/lms/student-homework/ui/deadline-badge";
import { fmtDate } from "@/components/lms/student-homework/lib/date";

import {
    useGetTasksQuery,
    useGetTaskSubmissionsQuery,
    useGetTaskSubmissionReviewsQuery,
    useDeleteTaskSubmissionMutation,
    useCreateTaskSubmissionMutation,
    useUpdateTaskSubmissionMutation,
} from "@/store/task-default/task-default.api";

import { useGetGroupsQuery } from "@/store/groups/group.api";

import type { Task, TaskSubmission, TaskReview } from "@/store/task-default/task-default.type";
import type { Group } from "@/store/groups/group.type";

import { TaskSubmissionDialog } from "./dialog/add-student-task/page";

type Props = {
    studentId: number;
    studentName?: string;
};

export default function StudentCourseTaskDashboard({ studentId, studentName }: Props) {
    const router = useRouter();

    const [scopeKind, setScopeKind] = useState<"student" | "group">("student");
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

    const groupsQuery = useGetGroupsQuery({
        page: 1,
        page_size: 50,
        ordering: "name",
    });

    const groups = (groupsQuery.data?.results ?? []) as Group[];
    const hasGroups = groups.length > 0;

    useEffect(() => {
        if (scopeKind !== "group") return;
        if (!hasGroups) return;
        if (selectedGroupId !== null) return;
        setSelectedGroupId(groups[0]?.id ?? null);
    }, [scopeKind, hasGroups, groups, selectedGroupId]);

    const tasksQuery = useGetTasksQuery({
        page: 1,
        page_size: 50,
        ordering: "-updated_at",
    });

    const submissionsQuery = useGetTaskSubmissionsQuery(
        studentId
            ? {
                page: 1,
                page_size: 50,
                ordering: "-updated_at",
                student_id: studentId,
                ...(scopeKind === "group" && selectedGroupId ? { group_id: selectedGroupId } : {}),
            }
            : skipToken
    );

    const reviewsQuery = useGetTaskSubmissionReviewsQuery(
        studentId
            ? {
                page: 1,
                page_size: 50,
                ordering: "-updated_at",
                student_id: studentId,
                ...(scopeKind === "group" && selectedGroupId ? { group_id: selectedGroupId } : {}),
            }
            : skipToken
    );

    const tasks = (tasksQuery.data?.results ?? []) as Task[];
    const submissions = (submissionsQuery.data?.results ?? []) as TaskSubmission[];
    const reviews = (reviewsQuery.data?.results ?? []) as TaskReview[];

    const submissionByTaskId = useMemo(() => {
        const m = new Map<number, TaskSubmission>();
        for (const s of submissions) {
            const taskId = s?.task?.id;
            if (typeof taskId === "number") m.set(taskId, s);
        }
        return m;
    }, [submissions]);

    const reviewByTaskId = useMemo(() => {
        const m = new Map<number, TaskReview>();
        for (const r of reviews) {
            const taskId = r?.task?.id;
            if (typeof taskId === "number") m.set(taskId, r);
        }
        return m;
    }, [reviews]);

    const derived = useMemo(() => {
        const now = Date.now();

        const items = tasks
            .map((t) => {
                const sub = submissionByTaskId.get(t.id) ?? null;
                const rev = reviewByTaskId.get(t.id) ?? null;

                const deadline = typeof t.deadline === "string" ? t.deadline : null;

                const deadlineTs =
                    deadline && !Number.isNaN(new Date(deadline).getTime())
                        ? new Date(deadline).getTime()
                        : Number.POSITIVE_INFINITY;

                const deadlinePassed = deadlineTs !== Number.POSITIVE_INFINITY ? deadlineTs < now : false;

                const hasSubmission = Boolean(sub);

                const gradeValue = (rev?.grade as any)?.value ?? null;
                const isRated = typeof gradeValue === "number";

                return {
                    task: t,
                    sub,
                    rev,
                    deadline,
                    deadlineTs,
                    deadlinePassed,
                    hasSubmission,
                    isRated,
                    gradeValue,
                };
            })
            .sort((a, b) => a.deadlineTs - b.deadlineTs);

        const active = items.filter((x) => !x.hasSubmission);
        const submitted = items.filter((x) => x.hasSubmission && !x.isRated);
        const graded = items.filter((x) => x.hasSubmission && x.isRated);

        const upcoming = items.filter((x) => x.deadline && !x.deadlinePassed).slice(0, 6);

        return { items, active, submitted, graded, upcoming };
    }, [tasks, submissionByTaskId, reviewByTaskId]);

    const total = tasks.length;
    const completed = derived.graded.length;
    const inReview = derived.submitted.length;
    const needAction = derived.active.length;

    const isLoading =
        tasksQuery.isLoading ||
        submissionsQuery.isLoading ||
        reviewsQuery.isLoading ||
        groupsQuery.isLoading;

    const [createTaskSubmission, createState] = useCreateTaskSubmissionMutation();
    const [updateTaskSubmission, updateState] = useUpdateTaskSubmissionMutation();
    const [deleteTaskSubmission, deleteState] = useDeleteTaskSubmissionMutation();

    const isMutating = createState.isLoading || updateState.isLoading || deleteState.isLoading;

    const [submitOpen, setSubmitOpen] = useState(false);
    const [submitTask, setSubmitTask] = useState<Task | null>(null);

    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedback, setFeedback] = useState<{ title: string; gradeText: string; commentText: string } | null>(null);

    const existingSubmission = useMemo(() => {
        if (!submitTask) return null;
        return submissionByTaskId.get(submitTask.id) ?? null;
    }, [submitTask, submissionByTaskId]);

    const submitDeadlinePassed = useMemo(() => {
        const d = submitTask?.deadline;
        if (!d) return false;
        const ts = new Date(d).getTime();
        if (Number.isNaN(ts)) return false;
        return ts < Date.now();
    }, [submitTask]);

    return (
        <div className="space-y-6">
            <DashboardHeaderCard
                title="Завдання курсу"
                isLoading={isLoading}
                needAction={needAction}
                inReview={inReview}
                completed={completed}
                total={total}
                onOpenNearest={() => {
                    const first = derived.upcoming[0];
                    if (!first) return;
                    router.push(`/lms/student/course-task/${first.task.id}`);
                }}
                groupSelectSlot={
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Button
                                variant={scopeKind === "student" ? "default" : "outline"}
                                className={scopeKind === "student" ? "" : "bg-transparent"}
                                onClick={() => setScopeKind("student")}
                            >
                                Персонально
                            </Button>

                            <Button
                                variant={scopeKind === "group" ? "default" : "outline"}
                                className={scopeKind === "group" ? "" : "bg-transparent"}
                                onClick={() => setScopeKind("group")}
                                disabled={!hasGroups}
                            >
                                Група
                            </Button>
                        </div>

                        {scopeKind === "group" ? (
                            groupsQuery.isLoading ? (
                                <div className="text-sm text-muted-foreground">Завантаження…</div>
                            ) : !hasGroups ? (
                                <div className="text-sm text-muted-foreground">Немає</div>
                            ) : (
                                <Select
                                    value={selectedGroupId ? String(selectedGroupId) : ""}
                                    onValueChange={(v) => setSelectedGroupId(v ? Number(v) : null)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Оберіть групу" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups.map((g) => (
                                            <SelectItem key={g.id} value={String(g.id)}>
                                                {g.name ?? `Група #${g.id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )
                        ) : (
                            <div className="text-sm text-muted-foreground">Студент: {studentName ?? "Немає"}</div>
                        )}
                    </div>
                }
                helperSlot={null}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-semibold">Найближчі дедлайни</div>
                            <div className="text-sm text-muted-foreground">Що варто закрити в першу чергу</div>
                        </div>
                        <Badge variant="secondary">{derived.upcoming.length}</Badge>
                    </div>

                    {isLoading ? (
                        <EmptyCard title="Завантаження" description="Отримуємо дані з сервера" icon={<CalendarDays className="w-5 h-5" />} />
                    ) : derived.upcoming.length === 0 ? (
                        <EmptyCard title="Немає завдань з дедлайном" description="Немає активних завдань." icon={<CalendarDays className="w-5 h-5" />} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {derived.upcoming.map(({ task, deadline, deadlinePassed }) => (
                                <Card key={task.id} className="overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <div className="flex flex-col 2xl:flex-row items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <CardTitle className="truncate">{task.title ?? "Немає"}</CardTitle>
                                            </div>
                                            <div className="flex flex-col xl:flex-row xl:items-center gap-2">
                                                <DeadlineBadge deadline={deadline ?? null} />
                                                <Badge variant="secondary" className="hidden sm:inline-flex">
                                                    До {fmtDate(deadline ?? null)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description ?? "Немає"}</p>

                                        <div className="flex flex-col 2xl:flex-row gap-2">
                                            <Button
                                                className="w-full sm:w-auto cursor-pointer"
                                                onClick={() => {
                                                    setSubmitTask(task);
                                                    setSubmitOpen(true);
                                                }}
                                                disabled={isMutating || deadlinePassed}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Здати роботу
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="bg-transparent w-full sm:w-auto cursor-pointer"
                                                onClick={() => router.push(`/lms/student/course-task/${task.id}`)}
                                            >
                                                Деталі
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <div>
                            <div className="text-lg font-semibold">Потрібна дія</div>
                            <div className="text-sm text-muted-foreground">Завдання, які ще не здані</div>
                        </div>
                        <Badge variant="secondary">{derived.active.length}</Badge>
                    </div>

                    {isLoading ? (
                        <EmptyCard title="Завантаження" description="Отримуємо дані з сервера" icon={<CheckCircle2 className="w-5 h-5" />} />
                    ) : derived.active.length === 0 ? (
                        <EmptyCard title="Все здано" description="Немає активних завдань." icon={<CheckCircle2 className="w-5 h-5" />} />
                    ) : (
                        <div className="space-y-4">
                            {derived.active.map(({ task, deadline, deadlinePassed }) => (
                                <Card key={task.id} className="overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <CardTitle className="truncate">{task.title ?? "Немає"}</CardTitle>
                                            </div>
                                            <DeadlineBadge deadline={deadline ?? null} />
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description ?? "Немає"}</p>

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button
                                                className="w-full sm:w-auto cursor-pointer"
                                                onClick={() => {
                                                    setSubmitTask(task);
                                                    setSubmitOpen(true);
                                                }}
                                                disabled={isMutating || deadlinePassed}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Здати
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="bg-transparent w-full sm:w-auto cursor-pointer"
                                                onClick={() => router.push(`/lms/student/course-task/${task.id}`)}
                                            >
                                                Деталі
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-semibold">Остання активність</div>
                            <div className="text-sm text-muted-foreground">Здані та оцінені роботи</div>
                        </div>
                        <Badge variant="secondary">{derived.submitted.length + derived.graded.length}</Badge>
                    </div>

                    {isLoading ? (
                        <EmptyCard title="Завантаження" description="Отримуємо дані з сервера" icon={<MessageSquareText className="w-5 h-5" />} />
                    ) : derived.submitted.length + derived.graded.length === 0 ? (
                        <EmptyCard title="Поки що немає активності" description="Немає зданих/оцінених робіт." icon={<MessageSquareText className="w-5 h-5" />} />
                    ) : (
                        <div className="space-y-3">
                            {[...derived.submitted, ...derived.graded].map(({ task, sub, rev, deadline, deadlinePassed, isRated, gradeValue }) => {
                                const gradeText = typeof gradeValue === "number" ? String(gradeValue) : "Немає";
                                const rawComment = (rev?.grade as any)?.comment ?? null;
                                const commentText = rawComment ? String(rawComment).trim() || "Немає" : "Немає";
                                const hasGrade = gradeText !== "Немає";

                                return (
                                    <Card key={`${task.id}-${sub?.id ?? "sub"}`} className="hover:shadow-sm transition-shadow">
                                        <CardContent className="py-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-semibold truncate">{task.title ?? "Немає"}</div>
                                                        <Badge variant={isRated ? "secondary" : "default"}>{isRated ? "Оцінено" : "Здано"}</Badge>
                                                    </div>
                                                </div>

                                                {isRated ? (
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-primary">{hasGrade ? gradeText : "Немає"}</div>
                                                        <div className="text-xs text-muted-foreground">балів</div>
                                                    </div>
                                                ) : (
                                                    <Badge variant="secondary" className="whitespace-nowrap">
                                                        До {fmtDate(deadline ?? null)}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="bg-transparent w-full sm:w-auto cursor-pointer"
                                                    disabled={!isRated && deadlinePassed}
                                                    onClick={() => {
                                                        if (!isRated && deadlinePassed) return;

                                                        if (!isRated) {
                                                            router.push(`/lms/student/course-task/${task.id}`);
                                                            return;
                                                        }

                                                        setFeedback({
                                                            title: task.title ?? "Немає",
                                                            gradeText,
                                                            commentText,
                                                        });
                                                        setFeedbackOpen(true);
                                                    }}
                                                >
                                                    {isRated ? "Відгук викладача" : "Переглянути роботу"}
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    className="w-full sm:w-auto justify-between sm:justify-center cursor-pointer"
                                                    onClick={() => router.push(`/lms/student/course-task/${task.id}`)}
                                                    disabled={hasGrade}
                                                >
                                                    {hasGrade ? "Перевірено" : "Відкрити"}
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    <Card className="bg-muted/20">
                        <CardContent className="px-6 md:px-0 lg:px-6 py-2">
                            <div className="flex items-start gap-3">
                                <div className="space-y-2 flex flex-col w-full">
                                    <div className="font-semibold">Порада</div>
                                    <div className="text-sm text-muted-foreground">
                                        Закрий 1 активне завдання сьогодні — це найбільше підніме твій прогрес.
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="bg-transparent w-full cursor-pointer"
                                        onClick={() => {
                                            const first = derived.upcoming[0];
                                            if (!first) return;
                                            router.push(`/lms/student/course-task/${first.task.id}`);
                                        }}
                                        disabled={isLoading}
                                    >
                                        Найближче завдання
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full cursor-pointer"
                                        disabled={
                                            isMutating ||
                                            isLoading ||
                                            (() => {
                                                const item = derived.submitted[0];
                                                if (!item) return true;
                                                return item.deadlinePassed;
                                            })()
                                        }
                                        onClick={async () => {
                                            const item = derived.submitted[0];
                                            if (!item?.sub?.id) return;
                                            if (item.deadlinePassed) return;
                                            await deleteTaskSubmission({ id: item.sub.id }).unwrap();
                                        }}
                                    >
                                        Скасувати здачу
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>

                                    {(() => {
                                        const item = derived.submitted[0];
                                        const locked = item ? item.deadlinePassed : false;
                                        return locked ? (
                                            <div className="text-xs w-full text-muted-foreground">
                                                Дедлайн минув — скасування здачі недоступне.
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {(createState.error || updateState.error || deleteState.error) ? (
                        <div className="text-sm text-destructive">Сталася помилка. Спробуйте ще раз.</div>
                    ) : null}
                </div>

                <TaskSubmissionDialog
                    open={submitOpen}
                    onOpenChange={setSubmitOpen}
                    task={submitTask}
                    existingSubmission={existingSubmission}
                    isLocked={submitDeadlinePassed}
                    isMutating={isMutating}
                    onCreate={async (payload: any) => {
                        await createTaskSubmission({ payload }).unwrap();
                    }}
                    onUpdate={async (id: number, payload: any) => {
                        await updateTaskSubmission({ id, payload }).unwrap();
                    }}
                />

                <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Відгук викладача</DialogTitle>
                            <DialogDescription>{feedback ? `Завдання: ${feedback.title}` : "Немає"}</DialogDescription>
                        </DialogHeader>

                        <Card className="pt-0">
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm text-muted-foreground">Оцінка</div>
                                    <Badge variant="secondary">{feedback?.gradeText ?? "Немає"}</Badge>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Коментар</div>
                                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback?.commentText ?? "Немає"}</div>
                                </div>
                            </CardContent>
                        </Card>

                        <DialogFooter>
                            <Button className="cursor-pointer" variant="outline" onClick={() => setFeedbackOpen(false)}>
                                Закрити
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}