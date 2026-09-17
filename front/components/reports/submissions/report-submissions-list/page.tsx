"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Row } from "@/components/manager/groups/ui/Row";
import { ResponsiveList } from "@/components/ui/ResponsiveList";
import ActionsDropdown from "@/components/ui/actions-dropdown";
import { useGetReportSubmissionsQuery } from "@/store/reports/report-submission.api";
import {
    ReportSubmission,
    ReportSubmissionEnum,
} from "@/store/reports/report-submission.type";
import { REPORT_SUBMISSION_TYPE_LABELS } from "@/store/reports/report-submission.label";

export function ReportSubmissionsList() {
    const [page, setPage] = useState(1);

    const pageSize = 50;

    const { data, isLoading } = useGetReportSubmissionsQuery({
        page,
        page_size: pageSize,
        ordering: "-created_at",
    });

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Відправлені звіти</h1>

                <p className="text-sm text-muted-foreground">
                    Тут відображаються звіти, які працівники відправили на перевірку.
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
                    <Card className="grid grid-cols-2 px-4 py-3 text-sm text-muted-foreground xl:grid-cols-6">
                        <div>Шаблон</div>
                        <div className="hidden xl:block">Працівник</div>
                        <div className="hidden xl:block">Статус</div>
                        <div className="hidden xl:block">Дата</div>
                        <div className="hidden xl:block">Перевірив</div>
                        <div className="text-right xl:text-center">Дії</div>
                    </Card>
                }
                renderRow={(submission: ReportSubmission, open, onToggle) => (
                    <Card
                        onClick={onToggle}
                        className="grid cursor-pointer grid-cols-2 items-center px-4 py-3 xl:grid-cols-6"
                    >
                        <div className="w-[170px] break-words font-medium">
                            {submission.template?.title || "Немає"}
                        </div>

                        <div className="hidden w-[170px] break-words xl:block">
                            {submission.created_by?.full_name ||
                                submission.created_by?.email ||
                                "Немає"}
                        </div>

                        <div className="hidden w-[160px] break-words xl:block">
                            {submission.status
                                ? REPORT_SUBMISSION_TYPE_LABELS[
                                submission.status as ReportSubmissionEnum
                                ] || "Немає"
                                : "Немає"}
                        </div>

                        <div className="hidden w-[150px] break-words xl:block">
                            {submission.created_at
                                ? new Intl.DateTimeFormat("uk-UA", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                }).format(new Date(submission.created_at))
                                : "Немає"}
                        </div>

                        <div className="hidden w-[170px] break-words xl:block">
                            {submission.reviewed_by?.full_name ||
                                submission.reviewed_by?.email ||
                                "Немає"}
                        </div>

                        <div
                            className="flex justify-end xl:justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ActionsDropdown
                                items={[
                                    {
                                        key: "view",
                                        label: "",
                                        content: (
                                            <Link
                                                href={`/dashboard/manager/reports/submissions/${submission.id}`}
                                                className="flex cursor-pointer items-center px-2 py-1.5 text-sm outline-none"
                                            >
                                                Переглянути
                                            </Link>
                                        ),
                                    },
                                ]}
                            />
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
                            label="Працівник"
                            value={
                                submission.created_by?.full_name ||
                                submission.created_by?.email ||
                                "Немає"
                            }
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
                    </div>
                )}
            />
        </div>
    );
}