"use client";

import React, {useMemo, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {format} from "date-fns";
import {uk} from "date-fns/locale";
import {
    ArrowLeft,
    CalendarClock,
    Download,
    FileText,
    GraduationCap,
    MessageSquareText,
    User,
} from "lucide-react";

import {skipToken} from "@reduxjs/toolkit/query";

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Textarea} from "@/components/ui/textarea";
import {ResponsiveList} from "@/components/ui/ResponsiveList";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

import {
    useGetHomeWorkSubmissionReviewQuery,
    useRateHomeWorkSubmissionReviewMutation,
    useUnRateHomeWorkSubmissionReviewMutation,
} from "@/store/homework/homework.api";

import type {HomeWorkSubmissionReview} from "@/store/homework/homework.type";
import {toast} from "sonner";

const fmtDateTime = (v?: string | null) => {
    if (!v) return "Немає";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "Немає";
    return format(d, "dd.MM.yyyy HH:mm", {locale: uk});
};

function safeName(v?: string | null) {
    const s = (v ?? "").trim();
    return s ? s : "Немає";
}

function pickFileUrl(file: any): string | null {
    return (
        file?.url ??
        file?.file ??
        file?.file_url ??
        file?.download_url ??
        file?.path ??
        null
    );
}

function pickFileName(file: any, fallback = "Немає"): string {
    const n =
        file?.name ??
        file?.filename ??
        file?.original_name ??
        file?.title ??
        null;

    if (typeof n === "string" && n.trim()) return n.trim();

    const url = pickFileUrl(file);
    if (url) {
        const tail = String(url).split("/").pop();
        if (tail) return tail;
    }

    return fallback;
}

type GradeDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    review: HomeWorkSubmissionReview | null;
};

function GradeDialog({open, onOpenChange, review}: GradeDialogProps) {
    const [rate, rateState] = useRateHomeWorkSubmissionReviewMutation();
    const [unrate, unrateState] = useUnRateHomeWorkSubmissionReviewMutation();

    const [gradeValue, setGradeValue] = useState<string>("");
    const [comment, setComment] = useState<string>("");

    const isBusy = rateState.isLoading || unrateState.isLoading;
    const canSubmit = Boolean(review) && Boolean(gradeValue.trim());

    const currentGradeLabel = useMemo(() => {
        const g: any = (review as any)?.grade;
        if (!g) return "Немає";
        return g.value ?? g.name ?? g.label ?? "Немає";
    }, [review]);

    const onSubmit = async () => {
        if (!review) return;

        const fd = new FormData();

        fd.append("value", gradeValue);
        if (comment.trim()) fd.append("comment", comment.trim());

        try {
            await rate({id: review.id, body: fd}).unwrap();
            onOpenChange(false);
            setGradeValue("");
            setComment("");
        } catch (_e) {
        }
    };


    const onUnrate = async () => {
        if (!review) return;

        try {
            await unrate(review.id).unwrap();
            toast.success("Оцінку знято.");
            onOpenChange(false);
            setGradeValue("");
            setComment("");
        } catch (_e) {
            toast.error("Не вдалося зняти оцінку.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !isBusy && onOpenChange(v)}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Перевірка здачі</DialogTitle>
                    <DialogDescription>
                        {review
                            ? `Студент: ${safeName(review.student?.full_name ?? review.student?.email ?? "Немає")}`
                            : "Немає"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Card>
                        <CardContent className="pt-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm text-muted-foreground">Поточна оцінка</div>
                                <Badge variant="secondary">{currentGradeLabel}</Badge>
                            </div>

                            <div className="grid gap-2">
                                <div className="text-sm font-medium">Нова оцінка</div>
                                <input
                                    value={gradeValue}
                                    onChange={(e) => setGradeValue(e.target.value)}
                                    placeholder="Наприклад: 12 або A"
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="text-sm font-medium">Коментар</div>
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Напишіть фідбек студенту (необовʼязково)"
                                    className="min-h-[120px]"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button className="cursor-pointer" variant="outline" onClick={() => onOpenChange(false)}
                            disabled={isBusy}>
                        Закрити
                    </Button>

                    <Button className="cursor-pointer" variant="destructive" onClick={onUnrate}
                            disabled={isBusy || !review || !review.grade}>
                        Зняти оцінку
                    </Button>

                    <Button className="cursor-pointer" onClick={onSubmit} disabled={isBusy || !canSubmit}>
                        Зберегти
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function TeacherHomeworkSubmissionsPage() {
    const router = useRouter();

    const params = useParams<{ id?: string; homeworkId?: string }>();

    const homeworkIdRaw = params?.homeworkId ?? params?.id ?? "";
    const homeworkId = Number(homeworkIdRaw);
    const canLoad = Number.isFinite(homeworkId) && homeworkId > 0;

    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [selectedReview, setSelectedReview] = useState<HomeWorkSubmissionReview | null>(null);
    const [gradeOpen, setGradeOpen] = useState(false);

    const [filesOpen, setFilesOpen] = useState(false);
    const [filesReview, setFilesReview] = useState<HomeWorkSubmissionReview | null>(null);

    const {data, isLoading} = useGetHomeWorkSubmissionReviewQuery(
        canLoad
            ? {
                homework: homeworkId,
                page,
                page_size: pageSize,
                ordering: "-created_at",
            }
            : skipToken
    );

    const total = data?.count ?? 0;

    const stats = useMemo(() => {
        const list = data?.results ?? [];
        const withFiles = list.reduce((acc, r) => acc + ((r.files?.length ?? 0) > 0 ? 1 : 0), 0);
        const graded = list.reduce((acc, r) => acc + (r.grade ? 1 : 0), 0);
        return {withFiles, graded};
    }, [data]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3">
                <Button variant="outline" className="w-fit" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Назад
                </Button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-bold">Здачі домашнього завдання</h1>
                        <p className="text-muted-foreground">
                            {canLoad ? `Домашнє завдання номер: ${homeworkId}` : "Немає"}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{`Всього: ${total}`}</Badge>
                        <Badge variant="secondary">{`Оцінено: ${stats.graded}`}</Badge>
                        <Badge variant="secondary">{`З файлами: ${stats.withFiles}`}</Badge>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Список здач</CardTitle>
                    <CardDescription>
                        Натисніть “Перевірити”, щоб виставити оцінку та залишити коментар.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <ResponsiveList
                        data={data}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        isLoading={isLoading}
                        getId={(r: HomeWorkSubmissionReview) => r.id}
                        header={
                            <Card
                                className="px-4 py-3 grid grid-cols-2 xl:grid-cols-7 text-sm font-medium text-muted-foreground">
                                <div>Студент</div>
                                <div className="hidden xl:block">Статус</div>
                                <div className="hidden xl:block">Оцінка</div>
                                <div className="hidden xl:block">Текст</div>
                                <div className="hidden xl:block">Файли</div>
                                <div className="hidden xl:block">Дата</div>
                                <div className="text-right xl:text-center">Дії</div>
                            </Card>
                        }
                        renderRow={(r: HomeWorkSubmissionReview, _open, onToggle) => {
                            const studentName = safeName(r.student?.full_name ?? r.student?.email ?? "Немає");
                            const hasFiles = (r.files?.length ?? 0) > 0;

                            const gradeLabel = (() => {
                                const g: any = (r as any)?.grade;
                                if (!g) return "Немає";
                                return g.value ?? g.name ?? g.label ?? "Немає";
                            })();

                            const statusLabel = r.grade ? "Оцінено" : "Очікує перевірки";
                            const textPreview = (r.submission_text ?? "").trim();
                            const textShort = textPreview ? textPreview.slice(0, 80) : "Немає";

                            return (
                                <Card
                                    onClick={onToggle}
                                    className="px-4 py-3 grid grid-cols-2 xl:grid-cols-7 items-center cursor-pointer md:cursor-default"
                                >
                                    <div className="font-medium break-all flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground"/>
                                        <span className="truncate">{studentName}</span>
                                    </div>

                                    <div className="hidden xl:block">
                                        <Badge variant={r.grade ? "secondary" : "outline"}>{statusLabel}</Badge>
                                    </div>

                                    <div className="hidden xl:block">
                                        <Badge variant="secondary">
                                            <GraduationCap className="mr-2 h-3.5 w-3.5"/>
                                            {gradeLabel}
                                        </Badge>
                                    </div>

                                    <div className="hidden xl:block text-sm text-muted-foreground break-all">
                    <span className="inline-flex items-center gap-2">
                      <MessageSquareText className="h-4 w-4"/>
                        {textShort}
                    </span>
                                    </div>

                                    <div className="hidden xl:block text-sm">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 hover:underline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!hasFiles) return;
                                                setFilesReview(r);
                                                setFilesOpen(true);
                                            }}
                                        >
                                            <FileText className="h-4 w-4 text-muted-foreground"/>
                                            {hasFiles ? `${r.files.length} файл(ів)` : "Немає"}
                                        </button>
                                    </div>

                                    <div className="hidden xl:block text-sm">
                    <span className="inline-flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground"/>
                        {fmtDateTime(r.created_at)}
                    </span>
                                    </div>

                                    <div
                                        className="flex xl:flex-col [@media(min-width:1800px)]:flex-row flex-col md:flex-row justify-end xl:justify-center gap-2">
                                        <Button
                                            className="cursor-pointer"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedReview(r);
                                                setGradeOpen(true);
                                            }}
                                        >
                                            Перевірити
                                        </Button>
                                    </div>
                                </Card>
                            );
                        }}
                        renderMobileDetails={(r: HomeWorkSubmissionReview) => {
                            const studentName = safeName(r.student?.full_name ?? r.student?.email ?? "Немає");
                            const textPreview = (r.submission_text ?? "").trim();
                            const hasFiles = (r.files?.length ?? 0) > 0;

                            const gradeLabel = (() => {
                                const g: any = (r as any)?.grade;
                                if (!g) return "Немає";
                                return g.value ?? g.name ?? g.label ?? "Немає";
                            })();

                            return (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <div className="text-muted-foreground">Студент</div>
                                    <div className="text-right break-all">{studentName}</div>

                                    <div className="text-muted-foreground">Статус</div>
                                    <div className="text-right">{r.grade ? "Оцінено" : "Очікує перевірки"}</div>

                                    <div className="text-muted-foreground">Оцінка</div>
                                    <div className="text-right">{gradeLabel}</div>

                                    <div className="text-muted-foreground">Текст</div>
                                    <div className="text-right break-all">{textPreview ? textPreview : "Немає"}</div>

                                    <div className="text-muted-foreground">Файли</div>
                                    <div className="text-right">
                                        {hasFiles ? (
                                            <button
                                                type="button"
                                                className="hover:underline"
                                                onClick={() => {
                                                    setFilesReview(r);
                                                    setFilesOpen(true);
                                                }}
                                            >
                                                {`${r.files.length} файл(ів)`}
                                            </button>
                                        ) : (
                                            "Немає"
                                        )}
                                    </div>

                                    <div className="text-muted-foreground">Дата</div>
                                    <div className="text-right">{fmtDateTime(r.created_at)}</div>

                                    <div className="col-span-2 pt-2 grid gap-2">
                                        <Button
                                            className="w-full"
                                            onClick={() => {
                                                setSelectedReview(r);
                                                setGradeOpen(true);
                                            }}
                                        >
                                            Перевірити
                                        </Button>
                                    </div>
                                </div>
                            );
                        }}
                    />
                </CardContent>
            </Card>

            <GradeDialog open={gradeOpen} onOpenChange={setGradeOpen} review={selectedReview}/>

            <Sheet open={filesOpen} onOpenChange={setFilesOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>Файли здачі</SheetTitle>
                        <SheetDescription>
                            {filesReview
                                ? `Студент: ${safeName(filesReview.student?.full_name ?? filesReview.student?.email ?? "Немає")}`
                                : "Немає"}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-3">
                        {filesReview?.files?.length ? (
                            filesReview.files.map((f: any, idx: number) => {
                                const url = pickFileUrl(f);
                                const name = pickFileName(f, `Файл ${idx + 1}`);

                                return (
                                    <Card key={`${name}-${idx}`}>
                                        <CardContent className="pt-4 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="font-medium truncate">{name}</div>
                                                <div className="text-xs text-muted-foreground break-all">
                                                    {url ?? "Немає"}
                                                </div>
                                            </div>

                                            <Button asChild size="sm" disabled={!url}>
                                                <a
                                                    href={url ?? "#"}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    download
                                                >
                                                    <Download className="mr-2 h-4 w-4"/>
                                                    Завантажити
                                                </a>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <Card>
                                <CardContent className="pt-6 text-sm text-muted-foreground">Немає</CardContent>
                            </Card>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
