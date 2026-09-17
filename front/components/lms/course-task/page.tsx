"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { CalendarClock, ClipboardCheck, Folder } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveList } from "@/components/ui/ResponsiveList";

import type { Task } from "@/store/task-default/task-default.type";
import { useGetTasksQuery, useGetTaskSubmissionReviewsQuery } from "@/store/task-default/task-default.api";

import { DeleteTaskDialog } from "@/components/lms/course-task/dialog/delete-task/page";

const fmtDateTime = (v?: string | null) => {
    if (!v) return "Немає";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "Немає";
    return format(d, "dd.MM.yyyy HH:mm", { locale: uk });
};

const fmtDate = (v?: string | null) => {
    if (!v) return "Немає";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "Немає";
    return format(d, "dd.MM.yyyy", { locale: uk });
};

export default function TeacherCourseTasksPage() {
    const router = useRouter();

    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data, isLoading} = useGetTasksQuery({
        page,
        page_size: pageSize,
        ordering: "-created_at",
    });

    const { data: submissionsMeta } = useGetTaskSubmissionReviewsQuery({
        page: 1,
        page_size: 1,
        ordering: "-created_at",
    });

    const totalTasks = data?.count ?? 0;
    const totalSubmissions = submissionsMeta?.count ?? 0;

    const soonCount = useMemo(() => {
        const list = data?.results ?? [];
        const now = Date.now();
        const in48h = now + 48 * 60 * 60 * 1000;

        return list.reduce((acc, t) => {
            const deadline = t.deadline ? new Date(t.deadline).getTime() : NaN;
            if (!Number.isNaN(deadline) && deadline >= now && deadline <= in48h) return acc + 1;
            return acc;
        }, 0);
    }, [data]);

    const statStorage = useMemo(() => {
        const list = data?.results ?? [];
        const files = list.reduce((acc, t) => acc + (t.files?.length ?? 0), 0);
        const links = list.reduce((acc, t) => acc + (t.links?.length ?? 0), 0);
        return { files, links };
    }, [data]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Завдання курсу</h1>
                    <p className="text-muted-foreground">Керуйте завданнями та перевіряйте здачі</p>
                </div>

                <div className="flex gap-2">
                    <Button className="cursor-pointer" onClick={() => router.push("/lms/teacher/course-task/add")}>
                        + Додати завдання
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Folder className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalTasks}</p>
                                <p className="text-sm text-muted-foreground">Всього завдань</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                                <CalendarClock className="w-6 h-6 text-secondary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{soonCount}</p>
                                <p className="text-sm text-muted-foreground">Дедлайн за 48 год</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                                <ClipboardCheck className="w-6 h-6 text-accent-foreground" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalSubmissions}</p>
                                <p className="text-sm text-muted-foreground">Всього здач</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Останні завдання</CardTitle>
                    <CardDescription>{`Файлів: ${statStorage.files}, посилань: ${statStorage.links}`}</CardDescription>
                </CardHeader>

                <CardContent>
                    <ResponsiveList
                        data={data}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        isLoading={isLoading}
                        getId={(t: Task) => t.id}
                        header={
                            <Card className="px-4 py-3 grid grid-cols-2 xl:grid-cols-6 text-sm font-medium text-muted-foreground">
                                <div>Завдання</div>
                                <div className="hidden xl:block">Тема</div>
                                <div className="hidden xl:block">Дедлайн</div>
                                <div className="hidden xl:block">Матеріали</div>
                                <div className="hidden xl:block">Оновлено</div>
                                <div className="text-right xl:text-center">Дії</div>
                            </Card>
                        }
                        renderRow={(t: Task, _open, onToggle) => {
                            const title = t.title || "Немає";
                            const topicTitle = t.topic?.title || "Немає";
                            const filesCount = t.files?.length ?? 0;
                            const linksCount = t.links?.length ?? 0;

                            return (
                                <Card
                                    onClick={onToggle}
                                    className="px-4 py-3 grid grid-cols-2 xl:grid-cols-6 items-center cursor-pointer md:cursor-default"
                                >
                                    <div className="font-medium w-[140px] break-all">
                                        <span className="truncate">{title}</span>
                                    </div>

                                    <div className="hidden xl:block break-all">{topicTitle}</div>
                                    <div className="hidden xl:block text-sm">{fmtDate(t.deadline ?? null)}</div>

                                    <div className="hidden xl:block text-sm">
                                        {filesCount || linksCount ? `${filesCount} файл(ів), ${linksCount} лінк(ів)` : "Немає"}
                                    </div>

                                    <div className="hidden xl:block text-sm">{fmtDateTime(t.updated_at ?? null)}</div>

                                    <div className="flex flex-col sm:flex-row md:flex-col justify-end  gap-3">
                                        <Button
                                            className="cursor-pointer"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/lms/teacher/course-task/submission/${t.id}/`);
                                            }}
                                        >
                                            Здачі
                                        </Button>

                                        <Button
                                            className="cursor-pointer"
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/lms/teacher/course-task/edit/${t.id}`);
                                            }}
                                        >
                                            Редагувати
                                        </Button>

                                        <DeleteTaskDialog taskId={t.id} taskTitle={t.title} onClick={(e) => e.stopPropagation()} />
                                    </div>
                                </Card>
                            );
                        }}
                        renderMobileDetails={(t: Task) => {
                            const title = t.title || "Немає";
                            const topicTitle = t.topic?.title || "Немає";
                            const filesCount = t.files?.length ?? 0;
                            const linksCount = t.links?.length ?? 0;

                            return (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <div className="text-muted-foreground">Назва</div>
                                    <div className="text-right break-all">{title}</div>

                                    <div className="text-muted-foreground">Тема</div>
                                    <div className="text-right break-all">{topicTitle}</div>

                                    <div className="text-muted-foreground">Дедлайн</div>
                                    <div className="text-right break-all">{fmtDate(t.deadline ?? null)}</div>

                                    <div className="text-muted-foreground">Матеріали</div>
                                    <div className="text-right break-all">
                                        {filesCount || linksCount ? `${filesCount} файл(ів), ${linksCount} лінк(ів)` : "Немає"}
                                    </div>
                                </div>
                            );
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
