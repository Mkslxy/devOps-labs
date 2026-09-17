"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    useGetReportSubmissionByIdQuery,
    useReviewReportSubmissionMutation,
} from "@/store/reports/report-submission.api";
import { ReportSubmissionEnum } from "@/store/reports/report-submission.type";
import { REPORT_SUBMISSION_TYPE_LABELS } from "@/store/reports/report-submission.label";

interface ReportSubmissionDetailsProps {
    id: number;
    backPath?: string;
}

export function ReportSubmissionDetails({
                                            id,
                                            backPath = "/dashboard/manager/reports/submissions",
                                        }: ReportSubmissionDetailsProps) {
    const router = useRouter();

    const [reviewerComment, setReviewerComment] = useState("");
    const [errorText, setErrorText] = useState("");

    const { data, isLoading, isError } = useGetReportSubmissionByIdQuery(id, {
        skip: !id,
    });

    const [reviewReportSubmission, { isLoading: isReviewing }] =
        useReviewReportSubmissionMutation();

    useEffect(() => {
        if (data?.reviewer_comment) {
            setReviewerComment(data.reviewer_comment);
        }
    }, [data?.reviewer_comment]);

    const fields = useMemo(() => {
        if (!data?.template?.content_html) return [];

        if (typeof DOMParser === "undefined") return [];

        const parser = new DOMParser();
        const doc = parser.parseFromString(
            data.template.content_html,
            "text/html"
        );

        return Array.from(doc.querySelectorAll("span[data-report-field]")).map(
            (node, index) => {
                const fieldId =
                    node.getAttribute("data-field-id") ||
                    node.getAttribute("id") ||
                    `${index}`;

                const label =
                    node.getAttribute("data-field-label") ||
                    node.textContent ||
                    "Поле для заповнення";

                return {
                    id: fieldId,
                    label,
                    value: data.answers?.[fieldId],
                };
            }
        );
    }, [data?.template?.content_html, data?.answers]);

    const filledHtml = useMemo(() => {
        if (!data?.template?.content_html) return "";

        if (typeof DOMParser === "undefined") return "";

        const parser = new DOMParser();
        const doc = parser.parseFromString(
            data.template.content_html,
            "text/html"
        );

        Array.from(doc.querySelectorAll("span[data-report-field]")).forEach(
            (node, index) => {
                const fieldId =
                    node.getAttribute("data-field-id") ||
                    node.getAttribute("id") ||
                    `${index}`;

                const label =
                    node.getAttribute("data-field-label") ||
                    node.textContent ||
                    "Поле для заповнення";

                const value = data.answers?.[fieldId];

                node.textContent =
                    value !== undefined &&
                    value !== null &&
                    String(value).trim()
                        ? String(value)
                        : `Немає (${label})`;

                node.setAttribute(
                    "class",
                    "inline-block max-w-full rounded-md border border-dashed px-2 py-0.5 text-xs font-medium text-foreground whitespace-normal break-words align-baseline"
                );
            }
        );

        return doc.body.innerHTML;
    }, [data?.template?.content_html, data?.answers]);

    const handleReview = async (status: ReportSubmissionEnum) => {
        if (!data) return;

        setErrorText("");

        if (
            status === ReportSubmissionEnum.rejected &&
            !reviewerComment.trim()
        ) {
            setErrorText("Для відхилення потрібно написати коментар.");
            return;
        }

        await reviewReportSubmission({
            id: data.id,
            data: {
                status,
                reviewer_comment: reviewerComment.trim() || "",
            },
        }).unwrap();

        router.push(backPath)
    };

    if (isLoading) {
        return (
            <div className="px-3 pb-6 sm:px-4">
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground">
                        Завантаження звіту...
                    </p>
                </Card>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="px-3 pb-6 sm:px-4">
                <Card className="p-4">
                    <p className="text-sm text-destructive">
                        Не вдалося завантажити звіт
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4 overflow-x-hidden px-3 pb-6 sm:px-4">
            <Card className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-1">
                    <h1 className="break-words text-xl font-bold leading-tight sm:text-2xl">
                        Перегляд звіту
                    </h1>

                    <p className="break-words text-sm text-muted-foreground">
                        {data.template?.title || "Немає"}
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full shrink-0 gap-2 sm:w-auto"
                    onClick={() =>
                        router.push(backPath)
                    }
                >
                    <ArrowLeft className="h-4 w-4" />
                    Назад
                </Button>
            </Card>

            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
                <div className="min-w-0 space-y-4">
                    <Card className="min-w-0 space-y-3 p-3 sm:p-4">
                        <div className="space-y-1">
                            <h2 className="font-semibold">Заповнений звіт</h2>
                            <p className="text-xs text-muted-foreground">
                                Нижче показано шаблон із підставленими
                                відповідями працівника.
                            </p>
                        </div>

                        <div
                            className="min-h-[220px] max-w-full overflow-hidden break-words rounded-lg border bg-muted/20 p-3 text-sm leading-7 sm:min-h-[260px] sm:p-4 [&_*]:max-w-full [&_*]:break-words [&_a]:break-all [&_img]:h-auto [&_img]:max-w-full [&_ol]:pl-5 [&_p]:mb-3 [&_table]:w-full [&_table]:table-fixed [&_td]:break-words [&_th]:break-words [&_ul]:pl-5"
                            dangerouslySetInnerHTML={{
                                __html: filledHtml || "Немає",
                            }}
                        />
                    </Card>

                    <Card className="min-w-0 space-y-3 p-3 sm:p-4">
                        <div className="space-y-1">
                            <h2 className="font-semibold">Відповіді</h2>
                            <p className="text-xs text-muted-foreground">
                                Окремий список відповідей з усіх полів звіту.
                            </p>
                        </div>

                        {fields.length ? (
                            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                                {fields.map((field) => (
                                    <div
                                        key={field.id}
                                        className="min-w-0 rounded-lg border p-3"
                                    >
                                        <p className="break-words text-xs text-muted-foreground">
                                            {field.label || "Немає"}
                                        </p>

                                        <p className="break-words text-sm font-medium">
                                            {field.value !== undefined &&
                                            field.value !== null &&
                                            String(field.value).trim()
                                                ? String(field.value)
                                                : "Немає"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Немає
                            </p>
                        )}
                    </Card>
                </div>

                <div className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:self-start">
                    <Card className="min-w-0 space-y-3 p-3 sm:p-4">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <div className="min-w-0 rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">
                                    Працівник
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {data.created_by?.full_name ||
                                        data.created_by?.email ||
                                        "Немає"}
                                </p>
                            </div>

                            <div className="min-w-0 rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">
                                    Шаблон
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {data.template?.title || "Немає"}
                                </p>
                            </div>

                            <div className="min-w-0 rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">
                                    Статус
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {data.status
                                        ? REPORT_SUBMISSION_TYPE_LABELS[
                                        data.status as ReportSubmissionEnum
                                        ] || "Немає"
                                        : "Немає"}
                                </p>
                            </div>

                            <div className="min-w-0 rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">
                                    Дата відправки
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {data.created_at
                                        ? new Intl.DateTimeFormat("uk-UA", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        }).format(new Date(data.created_at))
                                        : "Немає"}
                                </p>
                            </div>

                            <div className="min-w-0 rounded-lg border p-3 sm:col-span-2 xl:col-span-1">
                                <p className="text-xs text-muted-foreground">
                                    Перевірив
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {data.reviewed_by?.full_name ||
                                        data.reviewed_by?.email ||
                                        "Немає"}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="min-w-0 space-y-3 p-3 sm:p-4">
                        <div className="space-y-1">
                            <h2 className="font-semibold">Перевірка</h2>
                            <p className="text-xs text-muted-foreground">
                                Додайте коментар і прийміть або відхиліть звіт.
                            </p>
                        </div>

                        <Textarea
                            value={reviewerComment}
                            onChange={(e) =>
                                setReviewerComment(e.target.value)
                            }
                            placeholder="Коментар перевіряючого"
                            rows={5}
                            className="min-h-[120px]"
                        />

                        {errorText && (
                            <p className="text-sm text-destructive">
                                {errorText}
                            </p>
                        )}

                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                            <Button
                                type="button"
                                className="w-full gap-2"
                                disabled={isReviewing}
                                onClick={() =>
                                    handleReview(
                                        ReportSubmissionEnum.approved
                                    )
                                }
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Прийняти
                            </Button>

                            <Button
                                type="button"
                                variant="destructive"
                                className="w-full gap-2"
                                disabled={isReviewing}
                                onClick={() =>
                                    handleReview(
                                        ReportSubmissionEnum.rejected
                                    )
                                }
                            >
                                <XCircle className="h-4 w-4" />
                                Відхилити
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}