"use client";

import React, { useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveList } from "@/components/ui/ResponsiveList";
import { Row } from "@/components/manager/groups/ui/Row";
import ActionsDropdown from "@/components/ui/actions-dropdown";

import {
    useActivateStudentSubscriptionMutation,
    useGetStudentSubscriptionsQuery,
} from "@/store/subscription/student-subscription.api";

import {
    StudentSubscription,
    StudentSubscriptionStatusEnum,
} from "@/store/subscription/student-subscription.type";

import { STUDENT_SUBSCRIPTION_STATUS_LABELS } from "@/store/subscription/student-subscription.label";
import {
    StudentSubscriptionDialog
} from "@/components/manager/subscription/plan/dialog/student-subscription-dialog/page";
import {
    DeleteStudentSubscriptionDialog
} from "@/components/manager/subscription/plan/dialog/delete-student-subscription/page";

export default function ManagerStudentSubscriptionsPage() {
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [selectedSubscription, setSelectedSubscription] =
        useState<StudentSubscription | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [errorText, setErrorText] = useState("");

    const { data, isLoading } = useGetStudentSubscriptionsQuery({
        page,
        ordering: "-created_at",
    });

    const [activateStudentSubscription] = useActivateStudentSubscriptionMutation();

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 md:gap-0 md:flex-row">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Призначення абонементів
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Привʼязка готового плану абонемента до студента та групи.
                    </p>
                </div>

                <Button
                    onClick={() => {
                        setSelectedSubscription(null);
                        setIsDialogOpen(true);
                    }}
                >
                    + Призначити абонемент
                </Button>
            </div>

            {errorText && (
                <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {errorText}
                </Card>
            )}

            <ResponsiveList
                data={data}
                isLoading={isLoading}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                getId={(s: StudentSubscription) => s.id}
                header={
                    <Card className="px-4 py-3 grid grid-cols-2 xl:grid-cols-6 text-sm text-muted-foreground">
                        <div>Студент</div>
                        <div className="hidden xl:block">План</div>
                        <div className="hidden xl:block">Група</div>
                        <div className="hidden xl:block">Уроки</div>
                        <div className="hidden xl:block">Статус</div>
                        <div className="text-right xl:text-center">Дії</div>
                    </Card>
                }
                renderRow={(s: StudentSubscription, open, onToggle) => (
                    <Card
                        onClick={onToggle}
                        className="px-4 py-3 grid grid-cols-2 xl:grid-cols-6 items-center cursor-pointer"
                    >
                        <div className="font-medium break-all">
                            {s.student?.full_name || "Немає"}
                            <div className="text-xs font-normal text-muted-foreground break-all">
                                {s.student?.email || "Немає"}
                            </div>
                        </div>

                        <div className="hidden xl:flex w-[180px] break-all">
                            {s.plan?.name || "Немає"}
                        </div>

                        <div className="hidden xl:flex w-[180px] break-all">
                            {s.group?.name || "Немає"}
                        </div>

                        <div className="hidden xl:flex w-[100px] break-all">
                            {s.lessons_remaining ?? "Немає"}
                        </div>

                        <div className="hidden xl:flex w-[140px]">
                            <Badge
                                variant={
                                    s.status === StudentSubscriptionStatusEnum.active
                                        ? "default"
                                        : "secondary"
                                }
                            >
                                {s.status
                                    ? STUDENT_SUBSCRIPTION_STATUS_LABELS[s.status]
                                    : "Немає"}
                            </Badge>
                        </div>

                        <div
                            className="flex justify-end xl:justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ActionsDropdown
                                items={[
                                    {
                                        key: "edit",
                                        label: "",
                                        content: (
                                            <div
                                                className="flex cursor-pointer items-center px-2 py-1.5 text-sm outline-none"
                                                onClick={() => {
                                                    setSelectedSubscription(s);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                Редагувати
                                            </div>
                                        ),
                                    },
                                    {
                                        key: "activate",
                                        label: "",
                                        hidden: s.status !== StudentSubscriptionStatusEnum.pending_assignment,
                                        content: (
                                            <div
                                                className="flex cursor-pointer items-center px-2 py-1.5 text-sm outline-none"
                                                onClick={async () => {
                                                    try {
                                                        setErrorText("");

                                                        await activateStudentSubscription({
                                                            id: s.id,
                                                            data: {
                                                                student_id: s.student.id,
                                                                plan_id: s.plan.id,
                                                                group_id: s.group.id,
                                                                lessons_remaining: s.lessons_remaining,
                                                                status: StudentSubscriptionStatusEnum.active,
                                                                start_date: s.start_date,
                                                                end_date: s.end_date,
                                                            },
                                                        }).unwrap();
                                                    } catch (error) {
                                                        setErrorText(JSON.stringify(error, null, 2));
                                                    }
                                                }}
                                            >
                                                Активувати
                                            </div>
                                        ),
                                    },
                                    {
                                        key: "delete",
                                        label: "",
                                        content: (
                                            <DeleteStudentSubscriptionDialog
                                                id={s.id}
                                                studentName={s.student?.full_name}
                                                planName={s.plan?.name}
                                                trigger={
                                                    <div className="flex cursor-pointer items-center px-2 py-1.5 text-sm text-destructive outline-none">
                                                        Видалити
                                                    </div>
                                                }
                                            />
                                        ),
                                    },
                                ]}
                            />
                        </div>
                    </Card>
                )}
                renderMobileDetails={(s: StudentSubscription) => (
                    <div className="space-y-3">
                        <Row label="План" value={s.plan?.name || "Немає"} />
                        <Row label="Група" value={s.group?.name || "Немає"} />
                        <Row
                            label="Залишок уроків"
                            value={s.lessons_remaining !== undefined ? String(s.lessons_remaining) : "Немає"}
                        />
                        <Row
                            label="Статус"
                            value={
                                s.status
                                    ? STUDENT_SUBSCRIPTION_STATUS_LABELS[s.status]
                                    : "Немає"
                            }
                        />
                        <Row label="Дата початку" value={s.start_date || "Немає"} />
                        <Row label="Дата завершення" value={s.end_date || "Немає"} />
                        <Row
                            label="Ціна плану"
                            value={
                                s.plan?.price
                                    ? `${Number(s.plan.price).toLocaleString("uk-UA", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })} ${s.plan?.currency?.symbol || s.plan?.currency?.code || ""}`
                                    : "Немає"
                            }
                        />
                    </div>
                )}
            />

            <StudentSubscriptionDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                subscription={selectedSubscription}
            />
        </div>
    );
}