"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { skipToken } from "@reduxjs/toolkit/query";
import { ArrowLeft, Link as LinkIcon, FileText, Upload, ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { fmtDate } from "@/components/lms/student-homework/lib/date";

import {
    useGetTaskByIdQuery,
    useGetTaskSubmissionsQuery,
    useCreateTaskSubmissionMutation,
    useUpdateTaskSubmissionMutation,
} from "@/store/task-default/task-default.api";

import type { Task, TaskSubmission } from "@/store/task-default/task-default.type";
import { TaskSubmissionDialog } from "@/components/lms/student-course-task/dialog/add-student-task/page";

function pickTaskDeadline(task: Task | null) {
    const v = (task as any)?.deadline ?? (task as any)?.due_date ?? (task as any)?.end_date ?? null;
    return typeof v === "string" ? v : null;
}

export default function StudentCourseTaskDetailsPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const taskId = Number(params.id);

    const [submitOpen, setSubmitOpen] = useState(false);

    const taskQuery = useGetTaskByIdQuery(Number.isFinite(taskId) ? { id: taskId } : skipToken);

    const subQuery = useGetTaskSubmissionsQuery(
        Number.isFinite(taskId)
            ? { page: 1, page_size: 20, ordering: "-updated_at", task_id: taskId }
            : skipToken
    );

    const task = (taskQuery.data ?? null) as Task | null;
    const submissions = (subQuery.data?.results ?? []) as TaskSubmission[];
    const existingSubmission = submissions[0] ?? null;

    const isLoading = taskQuery.isLoading || subQuery.isLoading;

    const title = (task as any)?.title ?? (task as any)?.name ?? "Немає";
    const description = (task as any)?.description ?? (task as any)?.text ?? "Немає";

    const deadline = pickTaskDeadline(task);

    const links = useMemo(() => {
        const raw = (task as any)?.links ?? (task as any)?.urls ?? [];
        if (!raw) return [];
        return Array.isArray(raw) ? raw : [raw];
    }, [task]);

    const files = useMemo(() => {
        const raw = (task as any)?.files ?? (task as any)?.attachments ?? [];
        if (!raw) return [];
        return Array.isArray(raw) ? raw : [raw];
    }, [task]);

    const deadlineText = deadline ? `До ${fmtDate(deadline)}` : "Немає";
    const hasSubmission = Boolean(existingSubmission);

    const [createTaskSubmission, createState] = useCreateTaskSubmissionMutation();
    const [updateTaskSubmission, updateState] = useUpdateTaskSubmissionMutation();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => router.back()} className="justify-start px-0">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Назад
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Завантаження…</CardTitle>
                        <CardDescription>Отримуємо дані з сервера</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">Будь ласка, зачекайте</CardContent>
                </Card>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => router.back()} className="justify-start px-0">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Назад
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Немає</CardTitle>
                        <CardDescription>Завдання не знайдено</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-xl font-semibold truncate">{title || "Немає"}</div>
                    <div className="text-sm text-muted-foreground">Завдання курсу</div>
                </div>

                <Button variant="outline" className="bg-transparent" onClick={() => router.push("/lms/student/course-task")}>
                    До списку
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 space-y-5">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Опис</CardTitle>
                            <CardDescription>Що потрібно зробити</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm w-[300px] lg:w-full break-all text-muted-foreground whitespace-pre-wrap">
                            {description}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Посилання</CardTitle>
                            <CardDescription>Матеріали та корисні ресурси</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {links.length === 0 ? (
                                <div className="text-sm text-muted-foreground">Немає</div>
                            ) : (
                                links.map((u: any, idx: number) => {
                                    const url = typeof u === "string" ? u : (u?.url ?? "");
                                    const label = typeof u === "string" ? u : (u?.label ?? u?.title ?? url);
                                    if (!url) return null;

                                    return (
                                        <a
                                            key={`${url}-${idx}`}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block rounded-xl border p-3 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 text-muted-foreground">
                                                    <LinkIcon className="w-4 h-4" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="font-medium text-sm truncate">{label || "Немає"}</div>
                                                        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">{url}</div>
                                                </div>
                                            </div>
                                        </a>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Файли</CardTitle>
                            <CardDescription>Документи та вкладення</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {files.length === 0 ? (
                                <div className="text-sm text-muted-foreground">Немає</div>
                            ) : (
                                files.map((f: any, idx: number) => {
                                    const url = f?.url ?? f?.file ?? f?.download_url ?? "";
                                    const name = f?.name ?? f?.filename ?? `Файл #${idx + 1}`;
                                    if (!url) return null;

                                    return (
                                        <a
                                            key={`${url}-${idx}`}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block rounded-xl border p-3 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 text-muted-foreground">
                                                    <FileText className="w-4 h-4" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="font-medium text-sm truncate">{name || "Немає"}</div>
                                                        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">{url}</div>
                                                </div>
                                            </div>
                                        </a>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-5">
                    <Card className="top-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Статус та дії</CardTitle>
                            <CardDescription>Керування здачею</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm text-muted-foreground">Дедлайн</div>
                                    <div className="text-sm font-medium">{deadlineText}</div>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm text-muted-foreground">Стан</div>
                                    <Badge variant={hasSubmission ? "secondary" : "default"}>
                                        {hasSubmission ? "Здано" : "Не здано"}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 gap-2">
                                <Button onClick={() => setSubmitOpen(true)} className="w-full cursor-pointer">
                                    <Upload className="w-4 h-4 mr-2" />
                                    {hasSubmission ? "Редагувати здачу" : "Здати роботу"}
                                </Button>

                                <Button
                                    variant="outline"
                                    className="bg-transparent w-full cursor-pointer"
                                    onClick={() => router.push("/lms/student/course-task")}
                                >
                                    До списку
                                </Button>
                            </div>

                            {(createState.error || updateState.error) ? (
                                <div className="text-sm text-destructive">Сталася помилка. Спробуйте ще раз.</div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                <TaskSubmissionDialog
                    open={submitOpen}
                    onOpenChange={setSubmitOpen}
                    task={task}
                    existingSubmission={existingSubmission}
                    isLocked={false}
                    isMutating={createState.isLoading || updateState.isLoading}
                    onCreate={async (payload) => {
                        await createTaskSubmission({ payload }).unwrap();
                    }}
                    onUpdate={async (id, payload) => {
                        await updateTaskSubmission({ id, payload }).unwrap();
                    }}
                />
            </div>
        </div>
    );
}