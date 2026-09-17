"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { skipToken } from "@reduxjs/toolkit/query";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
    useGetHomeWorkQuery,
    useGetHomeWorkSubmissionQuery,
    useCreateHomeWorkSubmissionMutation,
    useUpdateHomeWorkSubmissionMutation,
    useDeleteHomeWorkSubmissionMutation,
} from "@/store/homework/homework.api";

import { useGetGroupsQuery } from "@/store/groups/group.api";
import { useGetAllLessonsQuery } from "@/store/lessons/lesson.api";

import type { Group } from "@/store/groups/group.type";
import type { Homework, HomeWorkSubmission } from "@/store/homework/homework.type";

import { SubmissionDialog } from "@/components/lms/homework/dialog/add-homework-submission/page";

import { DashboardHeaderCard } from "./ui/dashboard-header-card";
import { HomeworkScopeCards } from "./scope/homework-scope-cards";
import { EmptyCard } from "./ui/empty-card";
import { DeadlineBadge } from "./ui/deadline-badge";
import { fmtDate } from "./lib/date";
import { buildSubmissionMap, calcDerived } from "./lib/derive";

import { CalendarDays, CheckCircle2, MessageSquareText, Upload, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

type Props = {
    studentId: number;
    studentName?: string;
};

export default function StudentHomeworkDashboard({ studentId,studentName }: Props) {
    const router = useRouter();

    const [scopeKind, setScopeKind] = useState<"group" | "student" | "lesson">("group");
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

    const [submitOpen, setSubmitOpen] = useState(false);
    const [submitHw, setSubmitHw] = useState<Homework | null>(null);

    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedback, setFeedback] = useState<{
        title: string;
        gradeText: string;
        commentText: string;
    } | null>(null);

    const groupsQuery = useGetGroupsQuery({
        page: 1,
        page_size: 100,
        ordering: "name",
    });

    const groups: Group[] = groupsQuery.data?.results ?? [];
    const hasGroups = groups.length > 0;

    useEffect(() => {
        if (hasGroups && selectedGroupId === null) {
            setSelectedGroupId(groups[0]?.id ?? null);
        }
    }, [hasGroups, groups, selectedGroupId]);

    const lessonsQuery = useGetAllLessonsQuery(
      scopeKind === "lesson"
        ? { page: 1, page_size: 200}
        : skipToken
    );

    const lessons = lessonsQuery.data?.results ?? [];

    useEffect(() => {
        if (scopeKind !== "lesson") return;

        if (lessons.length > 0 && selectedLessonId === null) {
            setSelectedLessonId(lessons[0]?.id ?? null);
        }
    }, [scopeKind, lessons, selectedLessonId]);

    const hwParams = useMemo(() => {
        if (scopeKind === "student") {
            return { page: 1, page_size: 200, ordering: "-deadline", student: studentId };
        }

        if (scopeKind === "group") {
            if (!hasGroups) return { page: 1, page_size: 200, ordering: "-deadline", student: studentId };
            if (!selectedGroupId) return null;
            return { page: 1, page_size: 200, ordering: "-deadline", group: selectedGroupId };
        }

        scopeKind === "lesson"
        if (!selectedLessonId) return null;
        return { page: 1, page_size: 200, ordering: "-deadline", lesson: selectedLessonId };
    }, [scopeKind, hasGroups, selectedGroupId, selectedLessonId, studentId]);

    const subParams = useMemo(() => {
        if (scopeKind === "student") {
            return { page: 1, page_size: 500, ordering: "-updated_at", student: studentId };
        }

        if (scopeKind === "group") {
            if (!hasGroups) return { page: 1, page_size: 500, ordering: "-updated_at", student: studentId };
            if (!selectedGroupId) return null;
            return { page: 1, page_size: 500, ordering: "-updated_at", group: selectedGroupId };
        }

        if (!selectedLessonId) return null;
        return { page: 1, page_size: 500, ordering: "-updated_at", lesson: selectedLessonId };
    }, [scopeKind, hasGroups, selectedGroupId, selectedLessonId, studentId]);

    const hwQuery = useGetHomeWorkQuery(hwParams ?? skipToken);
    const subQuery = useGetHomeWorkSubmissionQuery(subParams ?? skipToken);

    const [, createState] = useCreateHomeWorkSubmissionMutation();
    const [, updateState] = useUpdateHomeWorkSubmissionMutation();
    const [deleteSubmission, deleteState] = useDeleteHomeWorkSubmissionMutation();

    const homework = hwQuery.data?.results ?? [];
    const submissions = subQuery.data?.results ?? [];

    const submissionByHomeworkId = useMemo(() => buildSubmissionMap(submissions as HomeWorkSubmission[]), [submissions]);

    const derived = useMemo(() => calcDerived(homework as Homework[], submissionByHomeworkId), [homework, submissionByHomeworkId]);

    const total = homework.length;
    const completed = derived.graded.length;
    const inReview = derived.submitted.length;
    const needAction = derived.active.length;

    const isLoading = hwQuery.isLoading || subQuery.isLoading || groupsQuery.isLoading;
    const isMutating = createState.isLoading || updateState.isLoading || deleteState.isLoading;

    const openDetails = useCallback((hw: Homework) => router.push(`/lms/student/homework/${hw.id}`), [router]);

    const isDeadlinePassed = (deadline?: string | null) => {
        if (!deadline) return false;
        const d = new Date(deadline);
        if (Number.isNaN(d.getTime())) return false;
        return d.getTime() < Date.now();
    };

    const submitHwDeadlinePassed = useMemo(() => {
        if (!submitHw) return false;
        return isDeadlinePassed(submitHw?.deadline ?? null);
    }, [submitHw]);

    const openNearest = useCallback(() => {
        const hw = derived.upcoming[0];
        if (!hw) return;
        openDetails(hw);
    }, [derived.upcoming, openDetails]);

    const existingSubmission = submitHw ? submissionByHomeworkId.get(submitHw.id) ?? null : null;

    const groupSelectSlot = scopeKind === "group" ? (
        hasGroups ? (
            <Select value={selectedGroupId ? String(selectedGroupId) : ""} onValueChange={(v) => setSelectedGroupId(v ? Number(v) : null)}>
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
        ) : (
            <div className="text-sm text-muted-foreground">
                Ви не додані до жодної групи — показуємо завдання, привʼязані до вашого профілю.
            </div>
        )
    ) : null;

    const lessonSelectSlot = scopeKind === "lesson" ? (
        lessonsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Завантаження уроків...</div>
        ) : lessons.length === 0 ? (
            <div className="text-sm text-muted-foreground">Немає уроків для цього студента.</div>
        ) : (
            <Select
                value={selectedLessonId ? String(selectedLessonId) : ""}
                onValueChange={(v) => setSelectedLessonId(v ? Number(v) : null)}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Оберіть урок" />
                </SelectTrigger>

                <SelectContent>
                    {lessons.map((l: any) => (
                        <SelectItem key={l.id} value={String(l.id)}>
                            {l.topic ?? l.title ?? `Урок #${l.id}`}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )
    ) : null;

    const pickGradeText = (sub: any) => {
        const v = sub?.grade?.score ?? sub?.grade?.value ?? sub?.grade ?? null;
        if (v === null || v === undefined) return "Немає";
        const s = String(v).trim();
        return s ? s : "Немає";
    };

    const pickTeacherComment = (sub: any) => {
        const v =
            sub?.grade?.comment ??
            sub?.comment ??
            sub?.teacher_comment ??
            sub?.review_comment ??
            sub?.feedback ??
            "";

        const s = String(v ?? "").trim();
        return s ? s : "Немає";
    };

    return (
        <div className="space-y-6">
            <DashboardHeaderCard
                title= "Домашні завдання"
                isLoading={isLoading}
                needAction={needAction}
                inReview={inReview}
                completed={completed}
                total={total}
                onOpenNearest={openNearest}
                groupSelectSlot={groupSelectSlot}
                helperSlot={lessonSelectSlot}
            />

            <HomeworkScopeCards
                scopeKind={scopeKind}
                onOpen={(kind) => setScopeKind(kind)}
                groupName={selectedGroupId ? (groups.find((g) => g.id === selectedGroupId))?.name ?? "Не обрано" : "Не обрано"}
                studentName={studentName}
                lessonName={selectedLessonId ? `Урок #${selectedLessonId}` : "Не обрано"}
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
                            {derived.upcoming.map((hw) => (
                                <Card key={hw.id} className="overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <div className="flex flex-col 2xl:flex-row items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <CardTitle className="truncate">{hw.title ?? "Немає"}</CardTitle>
                                            </div>
                                            <div className="flex flex-col xl:flex-row xl:items-center gap-2">
                                                <DeadlineBadge deadline={hw.deadline ?? null} />
                                                <Badge variant="secondary" className="hidden sm:inline-flex">
                                                    До {fmtDate(hw.deadline ?? null)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground line-clamp-2">{hw.description ?? "Немає"}</p>

                                        <div className="flex flex-col 2xl:flex-row gap-2">
                                            <Button
                                                className="w-full sm:w-auto cursor-pointer"
                                                onClick={() => {
                                                    setSubmitHw(hw);
                                                    setSubmitOpen(true);
                                                }}
                                                disabled={isMutating || isDeadlinePassed(hw.deadline ?? null)}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Здати роботу
                                            </Button>

                                            <Button variant="outline" className="bg-transparent w-full sm:w-auto cursor-pointer" onClick={() => openDetails(hw)}>
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
                        <EmptyCard title="Все здано" description="Немає активних домашніх завдань." icon={<CheckCircle2 className="w-5 h-5" />} />
                    ) : (
                        <div className="space-y-4">
                            {derived.active.map((hw) => (
                                <Card key={hw.id} className="overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <CardTitle className="truncate">{hw.title ?? "Немає"}</CardTitle>
                                            </div>
                                            <DeadlineBadge deadline={hw.deadline ?? null} />
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-muted-foreground line-clamp-2">{hw.description ?? "Немає"}</p>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button
                                                className="w-full sm:w-auto"
                                                onClick={() => {
                                                    setSubmitHw(hw);
                                                    setSubmitOpen(true);
                                                }}
                                                disabled={isMutating || isDeadlinePassed(hw.deadline ?? null)}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Здати
                                            </Button>

                                            <Button variant="outline" className="bg-transparent w-full sm:w-auto" onClick={() => openDetails(hw)}>
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
                            {[...derived.submitted, ...derived.graded].map(({ hw, sub }) => {
                                const gradeValue =
                                    sub?.grade?.value ?? null;

                                const isGraded = typeof gradeValue === "number";

                                const hasGrade = gradeValue !== null && String(gradeValue).trim() !== "" && String(gradeValue) !== "Немає";

                                const deadlinePassed = isDeadlinePassed(hw.deadline ?? null);

                                return (
                                    <Card key={`${hw.id}-${sub.id}`} className="hover:shadow-sm transition-shadow">
                                        <CardContent className="py-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-semibold truncate">{hw.title ?? "Немає"}</div>
                                                        <Badge variant={isGraded ? "secondary" : "default"}>
                                                            {isGraded ? "Оцінено" : "Здано"}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {isGraded ? (
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-primary">{gradeValue}</div>
                                                        <div className="text-xs text-muted-foreground">балів</div>
                                                    </div>
                                                ) : (
                                                    <Badge variant="secondary" className="whitespace-nowrap">
                                                        До {fmtDate(hw.deadline ?? null)}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="bg-transparent w-full sm:w-auto cursor-pointer"
                                                    disabled={!isGraded && deadlinePassed}
                                                    onClick={() => {
                                                        if (!isGraded && deadlinePassed) {
                                                            return;
                                                        }

                                                        if (!isGraded) {
                                                            openDetails(hw);
                                                            return;
                                                        }

                                                        setFeedback({
                                                            title: hw.title ?? "Немає",
                                                            gradeText: pickGradeText(sub),
                                                            commentText: pickTeacherComment(sub),
                                                        });
                                                        setFeedbackOpen(true);
                                                    }}
                                                >
                                                    {isGraded ? "Відгук викладача" : "Переглянути роботу"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full sm:w-auto justify-between sm:justify-center cursor-pointer"
                                                    onClick={() => openDetails(hw)}
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

                                    <Button variant="outline" className="bg-transparent w-full cursor-pointer" onClick={openNearest} disabled={isLoading}>
                                        Найближче дз
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
                                                return isDeadlinePassed((item.hw as any)?.deadline ?? null);
                                            })()
                                        }
                                        onClick={async () => {
                                            const item = derived.submitted[0];
                                            if (!item) return;
                                            if (isDeadlinePassed((item.hw as any)?.deadline ?? null)) return;
                                            await deleteSubmission(item.sub.id).unwrap();
                                        }}
                                    >
                                        Скасувати задачу
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                    {(() => {
                                        const item = derived.submitted[0];
                                        const locked = item ? isDeadlinePassed(item.hw?.deadline ?? null) : false;
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

                <SubmissionDialog
                    open={submitOpen}
                    onOpenChange={(v) => setSubmitOpen(v)}
                    homework={submitHw}
                    existingSubmission={existingSubmission}
                    isLocked={submitHwDeadlinePassed}
                />

                <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Відгук викладача</DialogTitle>
                            <DialogDescription>
                                {feedback ? `Завдання: ${feedback.title}` : "Немає"}
                            </DialogDescription>
                        </DialogHeader>

                        <Card className="pt-0">
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm text-muted-foreground">Оцінка</div>
                                    <Badge variant="secondary">{feedback?.gradeText ?? "Немає"}</Badge>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Коментар</div>
                                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {feedback?.commentText ?? "Немає"}
                                    </div>
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
