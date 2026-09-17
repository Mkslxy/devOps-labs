"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveList } from "@/components/ui/ResponsiveList";

import { useGetAttemptReviewQuery } from "@/store/test-management/test-management.api";

import type {
    AttemptStatusEnum,
    StudentAnswer,
    StudentResultDetail,
} from "@/store/test-management/test-management.type";

import { ATTEMPT_STATUS_LABELS } from "@/store/test-management/test-management.labels";
import {CATEGORY_LABELS} from "@/store/gradebook/gradebook.labels";
import {CategoryEnum} from "@/store/gradebook/gradebook.type";

type OptionLike = { id?: number; option_text?: string };

function toText(v: unknown): string {
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (!v) return "";
    if (typeof v === "object") {
        const o = v as OptionLike;
        if (typeof o.option_text === "string") return o.option_text;
    }
    return "";
}

function getAnswerItemText(item: any): string {
    const fromTextResponse = toText(item?.text_response);
    if (fromTextResponse) return fromTextResponse;

    const fromSelectedOptionText = toText(item?.selected_option_text);
    if (fromSelectedOptionText) return fromSelectedOptionText;

    const fromSelectedOptionObj = toText(item?.selected_option);
    if (fromSelectedOptionObj) return fromSelectedOptionObj;

    const fromOption = toText(item?.option);
    if (fromOption) return fromOption;

    return "";
}

export default function AttemptReviewPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const attemptId = Number(params.id);

    const { data, isLoading, isError } = useGetAttemptReviewQuery(attemptId, {
        skip: !attemptId,
        refetchOnMountOrArgChange: true,
    });

    const review = data as StudentResultDetail | undefined;
    const canShowAnswers = review?.show_answers !== false;

    const answers = useMemo<StudentAnswer[]>(() => {
        return review?.answers ?? [];
    }, [review]);

    const [page, setPage] = useState(1);
    const pageSize = 5;

    const pagedAnswers = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            results: answers.slice(start, end),
            count: answers.length,
        };
    }, [answers, page]);

    if (isLoading) {
        return (
            <div className="p-4">
                <Card className="p-4">Завантаження...</Card>
            </div>
        );
    }

    if (isError || !review) {
        return (
            <div className="p-4">
                <Card className="p-4">Не вдалося завантажити результат</Card>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-2 md:gap-0 justify-between">
                <h1 className="text-2xl font-bold">Результат тесту</h1>

                <Button className="cursor-pointer" variant="outline" onClick={() => router.push("/lms/student/tests")}>
                    До тестів
                </Button>
            </div>

            <Card className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                        {ATTEMPT_STATUS_LABELS[review.status as AttemptStatusEnum]}
                    </Badge>

                    <Badge variant="outline">Спроба #{attemptId}</Badge>

                    <Badge variant="outline">
                        {review.grade?.value ?? "Немає"} / {review.max_possible_score ?? "Немає"}
                    </Badge>
                </div>

                {review.grade ? (
                    <Card className="p-4 bg-muted/40 space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {review.grade.value !== undefined ? (
                                <Badge variant="secondary">Оцінка: {review.grade.value}</Badge>
                            ) : null}

                            <Badge variant="outline">
                                {review.grade.category
                                    ? CATEGORY_LABELS[review.grade.category as CategoryEnum]
                                    : "Немає"}
                            </Badge>
                        </div>

                        {review.grade.comment ? (
                            <div className="text-sm whitespace-pre-wrap">{review.grade.comment}</div>
                        ) : null}

                        {Array.isArray(review.grade.files) && review.grade.files.length ? (
                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Файли</div>

                                <div className="flex flex-col gap-1">
                                    {review.grade.files.map((f) => (
                                        <a
                                            key={f.id}
                                            href={f.file}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm underline underline-offset-4"
                                        >
                                            {f.name || f.file}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </Card>
                ) : null}
            </Card>

            {!answers.length ? (
                <Card className="p-4 text-sm text-muted-foreground">Відповіді відсутні</Card>
            ) : (
                <ResponsiveList
                    data={pagedAnswers}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    isLoading={false}
                    getId={(a) => a.id}
                    header={
                        <Card className="px-4 py-3 grid grid-cols-2 xl:grid-cols-6 text-sm font-medium text-muted-foreground">
                            <div>Питання</div>
                            <div className="hidden xl:block">Бали</div>
                            <div className="hidden xl:block">Відповідь</div>
                            <div className="hidden xl:block">Правильні</div>
                            <div className="hidden xl:block">Коментар</div>
                            <div className="text-right xl:text-center">Статус</div>
                        </Card>
                    }
                    renderRow={(a: any, _open, onToggle) => {
                        const answerText = (a.items ?? [])
                            .map((i: any) => getAnswerItemText(i))
                            .filter(Boolean)
                            .join(", ");

                        const ok =
                            a.score_awarded !== undefined &&
                            a.question_points !== undefined &&
                            Number(a.question_points) > 0 &&
                            Number(a.score_awarded) >= Number(a.question_points);

                        return (
                            <Card
                                onClick={onToggle}
                                className="px-4 py-3 grid grid-cols-2 xl:grid-cols-6 items-center cursor-pointer md:cursor-default"
                            >
                                <div className="font-medium break-all">{a.question_text}</div>

                                <div className="hidden xl:block text-sm">
                                    {a.score_awarded} / {a.question_points}
                                </div>

                                <div className="hidden xl:block text-sm break-all">
                                    {answerText || "Немає"}
                                </div>

                                <div className="hidden xl:block text-sm break-all">
                                    {canShowAnswers
                                        ? (toText(a.correct_options) || "Немає")
                                        : "Вчитель заборонив перегляд правильних відповідей"}
                                </div>

                                <div className="hidden xl:block text-sm break-all">
                                    {toText(a.teacher_comment) || "Немає"}
                                </div>

                                <div className="flex justify-end xl:justify-center">
                                    <Badge variant={ok ? "secondary" : "outline"}>
                                        {ok ? "Провірено" : "Перевірка"}
                                    </Badge>
                                </div>
                            </Card>
                        );
                    }}
                    renderMobileDetails={(a: any) => {
                        const answerText = (a.items ?? [])
                            .map((i: any) => getAnswerItemText(i))
                            .filter(Boolean)
                            .join(", ");

                        return (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="text-muted-foreground">Бали</div>
                                <div className="text-right">
                                    {a.score_awarded} / {a.question_points}
                                </div>

                                <div className="text-muted-foreground">Відповідь</div>
                                <div className="text-right break-all">{answerText || "Немає"}</div>

                                <div className="text-muted-foreground">Коментар</div>
                                <div className="text-right break-all">
                                    {toText(a.teacher_comment) || "Немає"}
                                </div>

                                <div className="text-muted-foreground">Правильні</div>
                                <div className="text-right break-all">
                                    {canShowAnswers
                                        ? (toText(a.correct_options) || "Немає")
                                        : "Вчитель заборонив перегляд правильних відповідей"}
                                </div>
                            </div>
                        );
                    }}
                />
            )}
        </div>
    );
}
