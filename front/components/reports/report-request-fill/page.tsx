"use client";

import React, { ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetReportRequestByIdQuery } from "@/store/reports/report-request.api";
import { useCreateReportSubmissionMutation } from "@/store/reports/report-submission.api";
import { ReportRequestEnum } from "@/store/reports/report-request.type";
import { REPORT_REQUEST_TYPE_LABELS } from "@/store/reports/report-request.label";

interface ReportRequestFillProps {
    requestId: number;
    backPath: string;
    afterSubmitPath: string;
}

export function ReportRequestFill({
                                      requestId,
                                      backPath,
                                      afterSubmitPath,
                                  }: ReportRequestFillProps) {
    const router = useRouter();

    const [answers, setAnswers] = useState<Record<string, string>>({});

    const { data, isLoading, isError } = useGetReportRequestByIdQuery(
        requestId,
        {
            skip: !requestId,
        }
    );

    const [createReportSubmission, { isLoading: isSubmitting }] =
        useCreateReportSubmissionMutation();

    const parsedNodes = useMemo(() => {
        if (!data?.template?.content_html) return [];

        if (typeof DOMParser === "undefined") return [];

        const parser = new DOMParser();
        const doc = parser.parseFromString(
            data.template.content_html,
            "text/html"
        );

        return Array.from(doc.body.childNodes);
    }, [data?.template?.content_html]);

    const reportFields = useMemo(() => {
        if (!data?.template?.content_html) return [];

        if (typeof DOMParser === "undefined") return [];

        const parser = new DOMParser();
        const doc = parser.parseFromString(
            data.template.content_html,
            "text/html"
        );

        return Array.from(doc.querySelectorAll("span[data-report-field]")).map(
            (node, index) => {
                const id =
                    node.getAttribute("data-field-id") ||
                    node.getAttribute("id") ||
                    `${index}`;

                const label =
                    node.getAttribute("data-field-label") ||
                    node.textContent ||
                    "Поле для заповнення";

                return {
                    id,
                    label,
                };
            }
        );
    }, [data?.template?.content_html]);

    const renderHtmlNode = (node: ChildNode, key: string): ReactNode => {
        if (node.nodeType === 3) {
            return node.textContent;
        }

        if (node.nodeType !== 1) {
            return null;
        }

        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        if (
            tagName === "span" &&
            element.getAttribute("data-report-field") === "true"
        ) {
            const id =
                element.getAttribute("data-field-id") ||
                element.getAttribute("id") ||
                key;

            const label =
                element.getAttribute("data-field-label") ||
                element.textContent ||
                "Поле для заповнення";

            return (
                <input
                    key={key}
                    value={answers[id] || ""}
                    onChange={(e) =>
                        setAnswers({
                            ...answers,
                            [id]: e.target.value,
                        })
                    }
                    placeholder={label}
                    className="mx-1 inline-flex min-h-8 w-[180px] max-w-full rounded-md border border-dashed border-primary bg-background px-2 py-1 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-[220px]"
                />
            );
        }

        const children = Array.from(element.childNodes).map((child, index) =>
            renderHtmlNode(child, `${key}-${index}`)
        );

        if (tagName === "p") {
            return (
                <p key={key} className="mb-3 leading-7">
                    {children}
                </p>
            );
        }

        if (tagName === "strong") {
            return (
                <strong key={key} className="font-semibold">
                    {children}
                </strong>
            );
        }

        if (tagName === "em") {
            return (
                <em key={key} className="italic">
                    {children}
                </em>
            );
        }

        if (tagName === "u") {
            return (
                <u key={key} className="underline">
                    {children}
                </u>
            );
        }

        if (tagName === "h1") {
            return (
                <h1 key={key} className="mb-3 text-2xl font-bold">
                    {children}
                </h1>
            );
        }

        if (tagName === "h2") {
            return (
                <h2 key={key} className="mb-3 text-xl font-bold">
                    {children}
                </h2>
            );
        }

        if (tagName === "h3") {
            return (
                <h3 key={key} className="mb-2 text-lg font-semibold">
                    {children}
                </h3>
            );
        }

        if (tagName === "ul") {
            return (
                <ul key={key} className="mb-3 list-disc space-y-1 pl-5">
                    {children}
                </ul>
            );
        }

        if (tagName === "ol") {
            return (
                <ol key={key} className="mb-3 list-decimal space-y-1 pl-5">
                    {children}
                </ol>
            );
        }

        if (tagName === "li") {
            return (
                <li key={key} className="leading-7">
                    {children}
                </li>
            );
        }

        if (tagName === "hr") {
            return <hr key={key} className="my-4 border-border" />;
        }

        if (tagName === "br") {
            return <br key={key} />;
        }

        return (
            <span key={key} className="break-words">
                {children}
            </span>
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!data) return;

        await createReportSubmission({
            template_id: data.template.id,
            request_id: data.id,
            answers,
        }).unwrap();

        router.push(afterSubmitPath);
    };

    if (isLoading) {
        return (
            <Card className="p-4">
                <p className="text-sm text-muted-foreground">
                    Завантаження запиту...
                </p>
            </Card>
        );
    }

    if (isError || !data) {
        return (
            <Card className="p-4">
                <p className="text-sm text-destructive">
                    Не вдалося завантажити запит
                </p>
            </Card>
        );
    }

    if (data.status !== ReportRequestEnum.pending) {
        return (
            <div className="space-y-4 px-3 pb-6 sm:px-4">
                <Card className="space-y-3 p-4">
                    <h1 className="text-xl font-bold">Звіт недоступний</h1>

                    <p className="text-sm text-muted-foreground">
                        Цей звіт вже здано або він більше не доступний для заповнення.
                    </p>

                    <p className="text-sm">
                        Статус:{" "}
                        {REPORT_REQUEST_TYPE_LABELS[
                            data.status as ReportRequestEnum
                            ] || "Немає"}
                    </p>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(backPath)}
                    >
                        Назад
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4 overflow-x-hidden px-3 pb-6 sm:px-4">
            <div className="flex items-start justify-between gap-3 border-b pb-3">
                <div className="min-w-0 space-y-1">
                    <h1 className="text-xl font-bold leading-tight sm:text-2xl">
                        Заповнити звіт
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        {data.template?.title || "Немає"}
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-2"
                    onClick={() => router.push(backPath)}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Назад
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Card className="space-y-4 p-4">
                    <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-5">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Шаблон
                            </p>
                            <p className="font-medium">
                                {data.template?.title || "Немає"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Опис
                            </p>
                            <p className="font-medium">
                                {data.template?.description || "Немає"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Дедлайн
                            </p>
                            <p className="font-medium">
                                {data.deadline
                                    ? new Intl.DateTimeFormat("uk-UA", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    }).format(new Date(data.deadline))
                                    : "Немає"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Статус
                            </p>
                            <p className="font-medium">
                                {data.status
                                    ? REPORT_REQUEST_TYPE_LABELS[
                                    data.status as ReportRequestEnum
                                    ] || "Немає"
                                    : "Немає"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">
                                Прострочено
                            </p>
                            <p className="font-medium">
                                {data.is_overdue ? "Так" : "Ні"}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="space-y-3 p-4">
                    <div className="space-y-1">
                        <h2 className="font-semibold">Форма звіту</h2>
                        <p className="text-xs text-muted-foreground">
                            Заповніть поля прямо всередині шаблону.
                        </p>
                    </div>

                    <div className="min-h-[280px] max-w-full overflow-hidden break-words rounded-lg border bg-muted/20 p-4 text-sm leading-7 [&_*]:max-w-full [&_*]:break-words">
                        {parsedNodes.length
                            ? parsedNodes.map((node, index) =>
                                renderHtmlNode(node, `${index}`)
                            )
                            : "Немає"}
                    </div>

                    {!reportFields.length && (
                        <p className="text-sm text-muted-foreground">
                            У цьому шаблоні немає окремих полів для заповнення.
                        </p>
                    )}
                </Card>

                <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto"
                        onClick={() => router.push(backPath)}
                    >
                        Скасувати
                    </Button>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full gap-2 sm:w-auto"
                    >
                        <Send className="h-4 w-4" />
                        {isSubmitting ? "Відправлення..." : "Відправити"}
                    </Button>
                </div>
            </form>
        </div>
    );
}