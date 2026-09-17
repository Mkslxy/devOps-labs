"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Row } from "@/components/manager/groups/ui/Row";
import { ResponsiveList } from "@/components/ui/ResponsiveList";
import { useGetReportSubmissionsQuery } from "@/store/reports/report-submission.api";
import {
    ReportSubmission,
    ReportSubmissionEnum,
} from "@/store/reports/report-submission.type";
import { REPORT_SUBMISSION_TYPE_LABELS } from "@/store/reports/report-submission.label";
import { useGetProfileMeQuery } from "@/store/users/user.api";

export function MyReportSubmissions() {
    const [page, setPage] = useState(1);

    const pageSize = 50;

    const { data: profile, isLoading: isProfileLoading } =
        useGetProfileMeQuery();

    const { data, isLoading: isSubmissionsLoading } =
        useGetReportSubmissionsQuery(
            {
                page,
                page_size: pageSize,
                created_by: profile?.id,
                ordering: "-created_at",
            },
            {
                skip: !profile?.id,
            }
        );

    const isLoading = isProfileLoading || isSubmissionsLoading;

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Мої звіти</h1>

                <p className="text-sm text-muted-foreground">
                    Тут відображаються звіти, які ви вже відправили.
                </p>
            </div>

            <ResponsiveList
                data={data}
                isLoading={isLoading}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                getId={(submission: ReportSubmission) => submission.id}
                header={
                    <Card className="grid grid-cols-1 px-4 py-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-5">
                        <div>Шаблон</div>
                        <div className="hidden md:block">Статус</div>
                        <div className="hidden xl:block">Дата відправки</div>
                        <div className="hidden xl:block">Перевірив</div>
                        <div className="hidden xl:block">Коментар</div>
                    </Card>
                }
                renderRow={(submission: ReportSubmission, open, onToggle) => (
                    <Card
                        onClick={onToggle}
                        className="grid cursor-pointer grid-cols-1 items-center px-4 py-3 md:grid-cols-2 xl:grid-cols-5"
                    >
                        <div className="break-words font-medium">
                            {submission.template?.title || "Немає"}
                        </div>

                        <div className="hidden break-words md:block">
                            {submission.status
                                ? REPORT_SUBMISSION_TYPE_LABELS[
                                submission.status as ReportSubmissionEnum
                                ] || "Немає"
                                : "Немає"}
                        </div>

                        <div className="hidden break-words xl:block">
                            {submission.created_at
                                ? new Intl.DateTimeFormat("uk-UA", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                }).format(new Date(submission.created_at))
                                : "Немає"}
                        </div>

                        <div className="hidden break-words xl:block">
                            {submission.reviewed_by?.full_name ||
                                submission.reviewed_by?.email ||
                                "Немає"}
                        </div>

                        <div className="hidden break-words xl:block">
                            {submission.reviewer_comment || "Немає"}
                        </div>
                    </Card>
                )}
                renderMobileDetails={(submission: ReportSubmission) => (
                    <div className="space-y-3">
                        <Row
                            label="Шаблон"
                            value={submission.template?.title || "Немає"}
                        />

                        <Row
                            label="Опис"
                            value={submission.template?.description || "Немає"}
                        />

                        <Row
                            label="Статус"
                            value={
                                submission.status
                                    ? REPORT_SUBMISSION_TYPE_LABELS[
                                    submission.status as ReportSubmissionEnum
                                    ] || "Немає"
                                    : "Немає"
                            }
                        />

                        <Row
                            label="Дата відправки"
                            value={
                                submission.created_at
                                    ? new Intl.DateTimeFormat("uk-UA", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    }).format(new Date(submission.created_at))
                                    : "Немає"
                            }
                        />

                        <Row
                            label="Перевірив"
                            value={
                                submission.reviewed_by?.full_name ||
                                submission.reviewed_by?.email ||
                                "Немає"
                            }
                        />

                        <Row
                            label="Коментар"
                            value={submission.reviewer_comment || "Немає"}
                        />

                        <div className="space-y-2 rounded-lg border p-3">
                            <p className="text-sm font-medium">Відповіді</p>

                            {Object.entries(submission.answers || {}).length ? (
                                <div className="space-y-2">
                                    {Object.entries(
                                        submission.answers || {}
                                    ).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className="rounded-md bg-muted/40 p-2"
                                        >
                                            <p className="text-xs text-muted-foreground">
                                                {key || "Немає"}
                                            </p>

                                            <p className="break-words text-sm">
                                                {String(value || "Немає")}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Немає
                                </p>
                            )}
                        </div>
                    </div>
                )}
            />
        </div>
    );
}