"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Row } from "@/components/manager/groups/ui/Row";
import { ResponsiveList } from "@/components/ui/ResponsiveList";
import ActionsDropdown from "@/components/ui/actions-dropdown";
import { useGetReportRequestsQuery } from "@/store/reports/report-request.api";
import {
    ReportRequest,
    ReportRequestEnum,
} from "@/store/reports/report-request.type";
import { REPORT_REQUEST_TYPE_LABELS } from "@/store/reports/report-request.label";

export function ReportRequestsList() {
    const [page, setPage] = useState(1);

    const pageSize = 50;

    const { data, isLoading } = useGetReportRequestsQuery({
        page,
        page_size: pageSize,
        ordering: "deadline",
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">Запити на звіти</h1>

                    <p className="text-sm text-muted-foreground">
                        Тут менеджер бачить, кому і які звіти призначені.
                    </p>
                </div>

                <Button asChild>
                    <Link href="/dashboard/manager/reports/requests/create">
                        + Призначити звіт
                    </Link>
                </Button>
            </div>

            <ResponsiveList
                data={data}
                isLoading={isLoading}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                getId={(request: ReportRequest) => request.id}
                header={
                    <Card className="grid grid-cols-2 px-4 py-3 text-sm text-muted-foreground xl:grid-cols-6">
                        <div>Шаблон</div>
                        <div className="hidden xl:block">Працівник</div>
                        <div className="hidden xl:block">Дедлайн</div>
                        <div className="hidden xl:block">Статус</div>
                        <div className="hidden xl:block">Прострочено</div>
                        <div className="text-right xl:text-center">Дії</div>
                    </Card>
                }
                renderRow={(request: ReportRequest, open, onToggle) => (
                    <Card
                        onClick={onToggle}
                        className="grid cursor-pointer grid-cols-2 items-center px-4 py-3 xl:grid-cols-6"
                    >
                        <div className="w-[170px] break-words font-medium">
                            {request.template?.title || "Немає"}
                        </div>

                        <div className="hidden w-[170px] break-words xl:block">
                            {request.assigned_to?.full_name ||
                                request.assigned_to?.email ||
                                "Немає"}
                        </div>

                        <div className="hidden w-[150px] break-words xl:block">
                            {request.deadline
                                ? new Intl.DateTimeFormat("uk-UA", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                }).format(new Date(request.deadline))
                                : "Немає"}
                        </div>

                        <div className="hidden w-[140px] break-words xl:block">
                            {request.status
                                ? REPORT_REQUEST_TYPE_LABELS[
                                request.status as ReportRequestEnum
                                ] || "Немає"
                                : "Немає"}
                        </div>

                        <div className="hidden w-[110px] break-words xl:block">
                            {request.is_overdue ? "Так" : "Ні"}
                        </div>

                        <div
                            className="flex justify-end xl:justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ActionsDropdown
                                items={[
                                    {
                                        key: "view-submissions",
                                        label: "",
                                        content: (
                                            <Link
                                                href={`/dashboard/manager/reports/submissions?request=${request.id}`}
                                                className="flex cursor-pointer items-center px-2 py-1.5 text-sm outline-none"
                                            >
                                                Переглянути відповіді
                                            </Link>
                                        ),
                                    },
                                ]}
                            />
                        </div>
                    </Card>
                )}
                renderMobileDetails={(request: ReportRequest) => (
                    <div className="space-y-3">
                        <Row
                            label="Шаблон"
                            value={request.template?.title || "Немає"}
                        />

                        <Row
                            label="Опис"
                            value={request.template?.description || "Немає"}
                        />

                        <Row
                            label="Працівник"
                            value={
                                request.assigned_to?.full_name ||
                                request.assigned_to?.email ||
                                "Немає"
                            }
                        />

                        <Row
                            label="Дедлайн"
                            value={
                                request.deadline
                                    ? new Intl.DateTimeFormat("uk-UA", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    }).format(new Date(request.deadline))
                                    : "Немає"
                            }
                        />

                        <Row
                            label="Статус"
                            value={
                                request.status
                                    ? REPORT_REQUEST_TYPE_LABELS[
                                    request.status as ReportRequestEnum
                                    ] || "Немає"
                                    : "Немає"
                            }
                        />

                        <Row
                            label="Прострочено"
                            value={request.is_overdue ? "Так" : "Ні"}
                        />

                        <Row
                            label="Автор"
                            value={
                                request.created_by?.full_name ||
                                request.created_by?.email ||
                                "Немає"
                            }
                        />
                    </div>
                )}
            />
        </div>
    );
}