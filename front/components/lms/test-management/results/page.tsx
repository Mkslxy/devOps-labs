"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { toast } from "sonner";

import {
    useGetStudentResultByIdQuery,
    usePatchTestAnswerReviewMutation,
} from "@/store/test-management/test-management.api";
import {AttemptStatusEnum} from "@/store/test-management/test-management.type";
import {ATTEMPT_STATUS_LABELS} from "@/store/test-management/test-management.labels";

function safeText(v: unknown): string {
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
    return "Немає";
}

function clampNumber(n: number, min: number, max: number) {
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
}

function renderAnswer(value: unknown): React.ReactNode {
    if (value === null || value === undefined) return <span className="text-muted-foreground">Немає</span>;
    if (typeof value === "string") return value.trim() ? value : <span className="text-muted-foreground">Немає</span>;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.length ? value.map((x) => safeText(x)).join(", ") : "Немає";
    try {
        const s = JSON.stringify(value, null, 2);
        return (
            <pre className="text-xs whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-2">
        {s}
      </pre>
        );
    } catch {
        return "Немає";
    }
}

type LocalReviewState = Record<
    number,
    { score_awarded: string; teacher_comment: string }
>;

export default function ReviewResultClient() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const resultId = Number(params?.id);

    const { data, isFetching, isError } = useGetStudentResultByIdQuery(resultId, {
        skip: !Number.isFinite(resultId) || resultId <= 0,
    });

    const [patchReview, patchState] = usePatchTestAnswerReviewMutation();

    const [local, setLocal] = useState<LocalReviewState>({});

    const answers = useMemo(() => {
        const a = (data as any)?.answers ?? (data as any)?.student_answers ?? [];
        return Array.isArray(a) ? a : [];
    }, [data]);

    useEffect(() => {
        const next: LocalReviewState = {};
        for (const a of answers) {
            const id = Number(a?.id);
            if (!Number.isFinite(id)) continue;
            next[id] = {
                score_awarded: a?.score_awarded !== null && a?.score_awarded !== undefined ? String(a.score_awarded) : "",
                teacher_comment: typeof a?.teacher_comment === "string" ? a.teacher_comment : "",
            };
        }
        setLocal(next);
    }, [answers]);

    const header = useMemo(() => {
        const status = (Object.values(AttemptStatusEnum) as string[]).includes(String(data?.status)) ? (data?.status as AttemptStatusEnum) : undefined;
        const submitted = data?.grade?.created_at ?? "Немає";
        const gradeValue = data?.grade?.value;
        const maxPossible = data?.max_possible_score;

        return { status, submitted, gradeValue, maxPossible };
    }, [data]);

    const handleSetScore = (answerId: number, value: string) => {
        setLocal((prev) => ({
            ...prev,
            [answerId]: {
                score_awarded: value,
                teacher_comment: prev[answerId]?.teacher_comment ?? "",
            },
        }));
    };

    const handleSetComment = (answerId: number, value: string) => {
        setLocal((prev) => ({
            ...prev,
            [answerId]: {
                score_awarded: prev[answerId]?.score_awarded ?? "",
                teacher_comment: value,
            },
        }));
    };

    const saveOne = async (a: any) => {
        const answerId = Number(a?.id);
        if (!Number.isFinite(answerId)) return;

        const maxScore = Number(a?.question_points ?? 0);
        const raw = local[answerId]?.score_awarded ?? "";
        const parsed = raw === "" ? 0 : Number(raw);
        const clamped = clampNumber(parsed, 0, Number.isFinite(maxScore) && maxScore > 0 ? maxScore : parsed);

        try {
            await patchReview({
                id: answerId,
                data: {
                    score_awarded: clamped,
                    teacher_comment: local[answerId]?.teacher_comment ?? "",
                },
            }).unwrap();

            toast.success("Збережено");
        } catch (e: any) {
            toast.error("Не вдалося зберегти");
            console.error(e);
        }
    };

    if (!Number.isFinite(resultId) || resultId <= 0) {
        return (
            <div className="p-6">
                <Card className="rounded-2xl">
                    <CardContent className="p-6">
                        <div className="text-sm text-muted-foreground">Немає коректного ID результату.</div>
                        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
                            Назад
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const status = header.status;

    return (
        <div className="flex flex-col gap-4 sm:px-6 bg-muted/20">
            <Card className="rounded-2xl">
                <CardContent className="p-4 sm:p-6 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-lg font-semibold truncate">
                                Перевірка результату #{resultId}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Оцінка: {header.gradeValue ?? "Немає"} / {header.maxPossible ?? "Немає"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Надіслано: {safeText(header.submitted)}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge className="rounded-full" variant={status === AttemptStatusEnum.completed ? "secondary" : "outline"}>
                                {status ? ATTEMPT_STATUS_LABELS[status] : "Немає"}
                            </Badge>

                            <Button variant="outline" onClick={() => router.back()}>
                                Назад
                            </Button>
                        </div>
                    </div>

                    {isError ? (
                        <div className="text-sm text-destructive">Не вдалося завантажити результат.</div>
                    ) : null}
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardContent className="p-0">
                    <ScrollArea className="h-[680px]">
                        <div className="p-4 sm:p-6 grid gap-3">
                            {isFetching ? (
                                <div className="text-sm text-muted-foreground">Завантаження відповідей...</div>
                            ) : answers.length === 0 ? (
                                <div className="text-sm text-muted-foreground">Відповідей ще немає.</div>
                            ) : (
                                answers.map((a: any, idx: number) => {
                                    const answerId = Number(a?.id);
                                    const questionTitle = a?.question_text ?? `Питання ${idx + 1}`;

                                    const maxScore = Number(a?.question_points ?? 0);

                                    const studentAnswer = (a?.items ?? [])
                                        .map((i: any) => {
                                            const t = (i?.text_response ?? "").trim();
                                            if (t) return t;
                                            const s = (i?.selected_option_text ?? "").trim();
                                            if (s) return s;
                                            return "";
                                        })
                                        .filter(Boolean)
                                        .join(", ");

                                    const correctAnswer = (a?.correct_options ?? [])
                                        .map((o: any) => (o?.option_text ?? "").trim())
                                        .filter(Boolean)
                                        .join(", ");
                                    const maxScoreSafe = Number.isFinite(maxScore) ? maxScore : 0;

                                    const localScore = local[answerId]?.score_awarded ?? "";
                                    const localComment = local[answerId]?.teacher_comment ?? "";

                                    const awardedNum = localScore === "" ? NaN : Number(localScore);
                                    const isOverMax = Number.isFinite(awardedNum) && maxScoreSafe > 0 && awardedNum > maxScoreSafe;

                                    return (
                                        <Card key={answerId || idx} className="rounded-2xl">
                                            <CardContent className="p-4 sm:p-5 grid gap-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold truncate">
                                                            {safeText(questionTitle)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Максимум: {maxScoreSafe > 0 ? maxScoreSafe : "Немає"}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleSetScore(answerId, String(maxScoreSafe || 0))}
                                                            disabled={!Number.isFinite(answerId)}
                                                        >
                                                            Максимум
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleSetScore(answerId, "0")}
                                                            disabled={!Number.isFinite(answerId)}
                                                        >
                                                            0
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-12 gap-3">
                                                    <div className="col-span-12 lg:col-span-6">
                                                        <div className="text-xs font-medium mb-1">Відповідь студента</div>
                                                        <div className="rounded-xl border bg-card p-3 text-sm">
                                                            {renderAnswer(studentAnswer)}
                                                        </div>
                                                    </div>

                                                    <div className="col-span-12 lg:col-span-6">
                                                        <div className="text-xs font-medium mb-1">Правильна відповідь</div>
                                                        <div className="rounded-xl border bg-card p-3 text-sm">
                                                            {renderAnswer(correctAnswer)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-12 gap-3">
                                                    <div className="col-span-12 lg:col-span-4">
                                                        <div className="text-xs font-medium mb-1">Оцінка</div>
                                                        <Input
                                                            value={localScore}
                                                            onChange={(e) => handleSetScore(answerId, e.target.value)}
                                                            inputMode="numeric"
                                                            placeholder="0"
                                                        />
                                                        {isOverMax ? (
                                                            <div className="mt-1 text-xs text-destructive">
                                                                Оцінка більша за максимум.
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <div className="col-span-12 lg:col-span-8">
                                                        <div className="text-xs font-medium mb-1">Коментар викладача</div>
                                                        <Textarea
                                                            value={localComment}
                                                            onChange={(e) => handleSetComment(answerId, e.target.value)}
                                                            placeholder="Немає"
                                                            className="min-h-[44px]"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => saveOne(a)}
                                                        disabled={patchState.isLoading || !Number.isFinite(answerId)}
                                                    >
                                                        Зберегти
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
