"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import {
    useGetAttemptByIdQuery,
    useFinishAttemptMutation,
} from "@/store/test-management/test-management.api";

import {
    FinishAttemptPayload,
    Question,
    TypeEnum,
} from "@/store/test-management/test-management.type";

function safeJsonParse<T>(value: string | undefined | null, fallback: T): T {
    if (!value) return fallback;
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

function safeJsonStringify(value: unknown): string {
    try {
        return JSON.stringify(value);
    } catch {
        return "";
    }
}

function normalizeOptions(raw: any): any[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object" && Array.isArray(raw.results)) return raw.results;
    return [];
}

function getQuestionOptions(q: any): any[] {
    return (
        normalizeOptions(q?.options) ||
        normalizeOptions(q?.question_options) ||
        normalizeOptions(q?.questionOptions) ||
        normalizeOptions(q?.question?.options) ||
        []
    );
}

type AnyOption = any;

function getChoiceText(opt: AnyOption): string {
    return String(opt?.option_text ?? opt?.text ?? "Немає");
}

function getOrderingOptions(q: any): AnyOption[] {
    const raw = q?.options;
    return Array.isArray(raw) ? raw : [];
}

function getMatchingPairs(q: any): { id: number; text: string }[] {
    const raw = q?.options;
    const pairs = raw?.pairs;
    return Array.isArray(pairs) ? pairs : [];
}

function getMatchingChoices(q: any): string[] {
    const raw = q?.options;
    const choices = raw?.choices;
    return Array.isArray(choices) ? choices.map((x) => String(x)) : [];
}

function arrayMove<T>(arr: T[], from: number, to: number) {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
}

function OrderingDndList({
                             items,
                             onReorder,
                         }: {
    items: { id: number; text: string }[];
    onReorder: (from: number, to: number) => void;
}) {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    return (
        <div className="space-y-2">
            {items.map((item, i) => {
                const isDragging = dragIndex === i;
                const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;

                return (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                            setDragIndex(i);
                            e.dataTransfer.effectAllowed = "move";
                            try {
                                e.dataTransfer.setData("text/plain", String(i));
                            } catch {}
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setOverIndex(i);
                            e.dataTransfer.dropEffect = "move";
                        }}
                        onDragLeave={() => {
                            setOverIndex(null);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();

                            const fromRaw = e.dataTransfer.getData("text/plain");
                            const from = Number(fromRaw);
                            const to = i;

                            setDragIndex(null);
                            setOverIndex(null);

                            if (!Number.isFinite(from)) return;
                            onReorder(from, to);
                        }}
                        onDragEnd={() => {
                            setDragIndex(null);
                            setOverIndex(null);
                        }}
                        className={[
                            "flex items-center gap-3 rounded-md border p-3 transition select-none",
                            "cursor-grab active:cursor-grabbing",
                            isDragging ? "opacity-70" : "",
                            isOver ? "ring-2 ring-ring" : "",
                        ].join(" ")}
                    >
                        <div className="h-8 w-8 shrink-0 rounded-md border bg-muted flex items-center justify-center text-sm font-medium">
                            {i + 1}
                        </div>

                        <div className="flex-1 text-sm break-all">{item.text}</div>

                        <div className="text-xs text-muted-foreground">⋮⋮</div>
                    </div>
                );
            })}
        </div>
    );
}


export default function AttemptPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const attemptId = Number(params.id);

    const { data, isLoading, isError } = useGetAttemptByIdQuery(attemptId, {
        skip: !attemptId,
        refetchOnMountOrArgChange: true,
    });

    const [finishAttempt, { isLoading: isFinishing }] = useFinishAttemptMutation();

    const questions = useMemo<Question[]>(() => {
        const raw = data?.questions;
        return Array.isArray(raw) ? (raw as Question[]) : [];
    }, [data]);

    const hasQuestions = questions.length > 0;
    const isReady = !isLoading && !!data;

    const [timeUpOpen, setTimeUpOpen] = useState(false);
    const [timeUpSubmitting, setTimeUpSubmitting] = useState(false);

    const timeUpShownRef = React.useRef(false);

    const [answersByQid, setAnswersByQid] = useState<Record<number, FinishAttemptPayload["answers"][number]>>({});

    const answersRef = React.useRef(answersByQid);
    useEffect(() => {
        answersRef.current = answersByQid;
    }, [answersByQid]);

    const [index, setIndex] = useState(0);
    const [remaining, setRemaining] = useState<number>(() => Number(data?.remaining_seconds ?? 0));

    useEffect(() => {
        timeUpShownRef.current = false;
        setTimeUpOpen(false);
        setTimeUpSubmitting(false);

        setIndex(0);
        setAnswersByQid({});
        setRemaining(Number(data?.remaining_seconds ?? 0));
    }, [attemptId]);

    useEffect(() => {
        const next = Number(data?.remaining_seconds ?? 0);
        if (Number.isFinite(next)) setRemaining(next);
    }, [data]);

    useEffect(() => {
        if (!remaining) return;
        const t = window.setInterval(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
        return () => window.clearInterval(t);
    }, [remaining]);

    const current = hasQuestions ? questions[index] : null;

    useEffect(() => {
        if (!current) return;
        if (current.type !== TypeEnum.ordering) return;

        const opts = getOrderingOptions(current);
        const initial = opts.map((o: any) => o.id).filter(Boolean) as number[];
        if (!initial.length) return;

        setAnswersByQid((prev) => {
            const existing = prev[current.id]?.selected_option_ids;
            if (existing && existing.length) return prev;

            return {
                ...prev,
                [current.id]: { question_id: current.id, selected_option_ids: initial },
            };
        });
    }, [current?.id, current?.type]);

    const currentOptions = useMemo(() => getQuestionOptions(current), [current]);

    const answeredCount = useMemo(() => {
        if (!hasQuestions) return 0;
        return questions.reduce((acc, q) => {
            const a = answersByQid[q.id];
            const hasChoice = (a?.selected_option_ids?.length ?? 0) > 0;
            const hasText = Boolean(a?.text_response?.trim());
            return acc + (hasChoice || hasText ? 1 : 0);
        }, 0);
    }, [answersByQid, questions, hasQuestions]);

    const progress = useMemo(() => {
        if (!hasQuestions) return 0;
        return Math.round((answeredCount / questions.length) * 100);
    }, [answeredCount, questions.length, hasQuestions]);

    const timeLabel = useMemo(() => {
        const s = Math.max(0, remaining);
        const mm = String(Math.floor(s / 60)).padStart(2, "0");
        const ss = String(s % 60).padStart(2, "0");
        return `${mm}:${ss}`;
    }, [remaining]);

    useEffect(() => {
        if (!isReady) return;
        if (remaining <= 0) return;

        const t = window.setInterval(() => {
            setRemaining((s) => (s > 0 ? s - 1 : 0));
        }, 1000);

        return () => window.clearInterval(t);
    }, [isReady, remaining]);

    const setSingleChoice = (questionId: number, optionId: number) => {
        setAnswersByQid((prev) => ({
            ...prev,
            [questionId]: { question_id: questionId, selected_option_ids: [optionId] },
        }));
    };

    const onTimeUpConfirm = async () => {
        if (timeUpSubmitting) return;

        setTimeUpSubmitting(true);
        try {
            const payload: FinishAttemptPayload = { answers: Object.values(answersRef.current) };
            await finishAttempt({ id: attemptId, data: payload }).unwrap();

            setTimeUpOpen(false);
            router.replace(`/lms/student/tests/review/${attemptId}`);
        } catch (e) {
            setTimeUpSubmitting(false);
        }
    };

    const toggleMultipleChoice = (questionId: number, optionId: number) => {
        setAnswersByQid((prev) => {
            const currentIds = prev[questionId]?.selected_option_ids ?? [];
            const nextIds = currentIds.includes(optionId)
                ? currentIds.filter((x) => x !== optionId)
                : [...currentIds, optionId];

            return {
                ...prev,
                [questionId]: { question_id: questionId, selected_option_ids: nextIds },
            };
        });
    };

    const setTextAnswer = (questionId: number, text: string) => {
        setAnswersByQid((prev) => ({
            ...prev,
            [questionId]: { question_id: questionId, text_response: text },
        }));
    };

    const setMatchingPair = (questionId: number, leftOptionId: number, value: string) => {
        setAnswersByQid((prev) => {
            const currentMap = safeJsonParse<Record<string, string>>(prev[questionId]?.text_response, {});
            const nextMap = { ...currentMap, [String(leftOptionId)]: value };

            return {
                ...prev,
                [questionId]: { question_id: questionId, text_response: safeJsonStringify(nextMap) },
            };
        });
    };

    const setBlankValue = (questionId: number, blankGroupId: number, value: string) => {
        setAnswersByQid((prev) => {
            const currentMap = safeJsonParse<Record<string, string>>(prev[questionId]?.text_response, {});
            const nextMap = { ...currentMap, [String(blankGroupId)]: value };

            return {
                ...prev,
                [questionId]: { question_id: questionId, text_response: safeJsonStringify(nextMap) },
            };
        });
    };

    const goTo = (i: number) => {
        if (!hasQuestions) return;
        if (i < 0 || i >= questions.length) return;
        setIndex(i);
    };

    const onFinish = async () => {
        const payload: FinishAttemptPayload = { answers: Object.values(answersByQid) };
        await finishAttempt({ id: attemptId, data: payload }).unwrap();
        router.push(`/lms/student/tests/review/${attemptId}`);
    };

    if (isLoading) return <div className="p-4">Завантаження...</div>;
    if (isError || !data) return <div className="p-4">Не вдалося завантажити спробу</div>;

    return (
        <div className="mx-auto w-full max-w-5xl p-4 space-y-4">
            <Card className="p-4 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <div className="text-xl w-[230px] break-all font-semibold">{data.test_title}</div>
                        <div className="text-sm w-[230px] break-all text-muted-foreground">{data.test_description}</div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-2">
                        <Badge variant="secondary" className="text-base">{timeLabel}</Badge>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" disabled={!hasQuestions}>Питання</Button>
                            </SheetTrigger>

                            <SheetContent side="right" className="w-[320px]">
                                <SheetHeader>
                                    <SheetTitle>Навігація</SheetTitle>
                                </SheetHeader>

                                <div className="mt-4 grid grid-cols-5 gap-2">
                                    {questions.map((q, i) => {
                                        const a = answersByQid[q.id];
                                        const done = (a?.selected_option_ids?.length ?? 0) > 0 || Boolean(a?.text_response?.trim());
                                        const isCurrent = i === index;

                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => goTo(i)}
                                                className={[
                                                    "h-10 rounded-md border text-sm font-medium transition",
                                                    isCurrent ? "border-primary" : "border-border",
                                                    done ? "bg-muted" : "bg-background",
                                                ].join(" ")}
                                            >
                                                {i + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button disabled={isFinishing}>Завершити</Button>
                            </DialogTrigger>

                            <DialogContent className="sm:max-w-[520px]">
                                <DialogHeader>
                                    <DialogTitle>Завершити тест?</DialogTitle>
                                </DialogHeader>

                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div>{`Відповіли: ${answeredCount} з ${questions.length}`}</div>
                                    <div>{`Час: ${timeLabel}`}</div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="outline" onClick={() => router.back()}>
                                        Повернутися
                                    </Button>
                                    <Button onClick={onFinish} disabled={isFinishing}>
                                        Підтвердити
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{`Прогрес: ${answeredCount}/${questions.length}`}</span>
                        <span>{`${Math.round(progress)}%`}</span>
                    </div>
                    <Progress value={progress} />
                </div>
            </Card>

            <Card className="p-4 space-y-4">
                {!hasQuestions ? (
                    <div className="text-sm text-muted-foreground">
                        Питань немає. Ви можете одразу завершити тест.
                    </div>
                ) : null}

                {hasQuestions && current ? (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">{`Питання ${index + 1} з ${questions.length}`}</div>
                            <Badge variant="outline">{`${current.points} б.`}</Badge>
                        </div>

                        <div className="text-base font-medium whitespace-pre-wrap">{current.text}</div>

                        {current.media_url ? (
                            <div className="overflow-hidden rounded-lg border">
                                <img src={current.media_url} alt="Медіа" className="w-full h-auto" />
                            </div>
                        ) : null}

                        {current.type === TypeEnum.single_choice ? (
                            <div className="space-y-2">
                                {currentOptions.map((opt) => {
                                    const checked = (answersByQid[current.id]?.selected_option_ids?.[0] ?? null) === opt.id;
                                    return (
                                        <label key={opt.id} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer">
                                            <input type="radio" checked={checked} onChange={() => setSingleChoice(current.id, opt.id)} />
                                            <span className="text-sm">{opt.option_text}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : null}

                        {current.type === TypeEnum.multiple_choice ? (
                            <div className="space-y-2">
                                {currentOptions.map((opt) => {
                                    const checked = answersByQid[current.id]?.selected_option_ids?.includes(opt.id) ?? false;
                                    return (
                                        <label key={opt.id} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer">
                                            <input type="checkbox" checked={checked} onChange={() => toggleMultipleChoice(current.id, opt.id)} />
                                            <span className="text-sm">{opt.option_text}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : null}

                        {current.type === TypeEnum.open_text ? (
                            <Textarea
                                value={answersByQid[current.id]?.text_response ?? ""}
                                onChange={(e) => setTextAnswer(current.id, e.target.value)}
                                placeholder="Введіть відповідь..."
                                className="min-h-[140px]"
                            />
                        ) : null}

                        {current.type === TypeEnum.ordering ? (
                            <div className="space-y-3">
                                <div className="text-sm text-muted-foreground">
                                    Перетягніть елементи у правильному порядку.
                                </div>

                                {(() => {
                                    const opts = getOrderingOptions(current);
                                    const ids = answersByQid[current.id]?.selected_option_ids ?? [];

                                    if (!ids.length) {
                                        return <div className="text-sm text-muted-foreground">Завантаження порядку...</div>;
                                    }

                                    const map = new Map(opts.map((o: any) => [o.id, getChoiceText(o)]));

                                    const ordered = ids
                                        .map((id) => ({ id, text: map.get(id) ?? "Немає" }))
                                        .filter((x) => x.id != null);

                                    const onReorder = (from: number, to: number) => {
                                        setAnswersByQid((prev) => {
                                            const currentIds = prev[current.id]?.selected_option_ids ?? [];
                                            if (!currentIds.length) return prev;
                                            if (from === to) return prev;

                                            const nextIds = arrayMove(currentIds, from, to);

                                            return {
                                                ...prev,
                                                [current.id]: { question_id: current.id, selected_option_ids: nextIds },
                                            };
                                        });
                                    };

                                    return <OrderingDndList items={ordered} onReorder={onReorder} />;
                                })()}
                            </div>
                        ) : null}

                        {current.type === TypeEnum.matching ? (
                            <div className="space-y-3">
                                <div className="text-sm text-muted-foreground">
                                    Встановіть відповідності.
                                </div>

                                {(() => {
                                    const pairs = getMatchingPairs(current);
                                    const choices = getMatchingChoices(current);

                                    if (!pairs.length || !choices.length) {
                                        return (
                                            <div className="text-sm text-muted-foreground">
                                                Немає даних для відповідностей.
                                            </div>
                                        );
                                    }

                                    const map = safeJsonParse<Record<string, string>>(answersByQid[current.id]?.text_response, {});

                                    return (
                                        <div className="space-y-2">
                                            {pairs.map((p) => (
                                                <div key={p.id} className="rounded-md border p-3 space-y-2">
                                                    <div className="text-sm font-medium break-all">{p.text}</div>

                                                    {/* найпростіше: select із choices */}
                                                    <select
                                                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                                        value={map[String(p.id)] ?? ""}
                                                        onChange={(e) => setMatchingPair(current.id, p.id, e.target.value)}
                                                    >
                                                        <option value="">Оберіть варіант</option>
                                                        {choices.map((c) => (
                                                            <option key={c} value={c}>
                                                                {c}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : null}

                        {current.type === TypeEnum.fill_in_the_blank ? (
                            <div className="space-y-3">
                                <div className="text-sm text-muted-foreground">
                                    Заповніть пропуски.
                                </div>

                                {(() => {
                                    const map = safeJsonParse<Record<string, string>>(answersByQid[current.id]?.text_response, {});
                                    const groups = Array.from(
                                        new Set(
                                            (currentOptions ?? [])
                                                .map((o: any) => Number(o.blank_group_id))
                                                .filter((x) => Number.isFinite(x) && x > 0)
                                        )
                                    ).sort((a, b) => a - b);

                                    if (!groups.length) {
                                        return (
                                            <div className="text-sm text-muted-foreground">
                                                Немає пропусків для заповнення.
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-2">
                                            {groups.map((gid) => (
                                                <div key={gid} className="rounded-md border p-3 space-y-2">
                                                    <div className="text-sm font-medium">{`Пропуск #${gid}`}</div>
                                                    <Input
                                                        value={map[String(gid)] ?? ""}
                                                        onChange={(e) => setBlankValue(current.id, gid, e.target.value)}
                                                        placeholder="Введіть відповідь..."
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : null}

                        <div className="flex items-center justify-between pt-2">
                            <Button variant="outline" onClick={() => goTo(index - 1)} disabled={index === 0}>
                                Назад
                            </Button>

                            <Button onClick={() => goTo(index + 1)} disabled={index === questions.length - 1}>
                                Далі
                            </Button>
                        </div>
                    </>
                ) : null}
            </Card>

            <Dialog open={timeUpOpen} onOpenChange={() => {}}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Час вийшов</DialogTitle>
                    </DialogHeader>

                    <div className="text-sm text-muted-foreground">
                        Час на проходження тесту закінчився. Натисніть “Ок”, щоб завершити спробу та перейти до результату.
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button onClick={onTimeUpConfirm} disabled={timeUpSubmitting}>
                            Ок
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>

    );
}
