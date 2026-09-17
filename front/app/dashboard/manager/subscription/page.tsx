"use client";

import React, { useState } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveList } from "@/components/ui/ResponsiveList";
import { Row } from "@/components/manager/groups/ui/Row";
import ActionsDropdown from "@/components/ui/actions-dropdown";

import type { SubscriptionPlan } from "@/store/subscription/subscription-plan.type";
import { useGetSubscriptionPlansQuery } from "@/store/subscription/subscription-plan.api";
import { DeleteSubscriptionPlanDialog } from "@/components/manager/subscription/plan/dialog/delete-subscription-plan/page";

export default function SubscriptionPlansPage() {
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data, isLoading } = useGetSubscriptionPlansQuery({ page });

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold">Абонементи</h1>
                    <p className="text-sm text-muted-foreground">
                        Створення та редагування абонементів для курсів
                    </p>
                </div>

                <Button asChild>
                    <Link href="/dashboard/manager/subscription/add/">
                        + Додати абонемент
                    </Link>
                </Button>
            </div>

            <ResponsiveList
                data={data}
                isLoading={isLoading}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                getId={(plan: SubscriptionPlan) => plan.id}
                header={
                    <Card className="grid grid-cols-2 px-4 py-3 text-sm text-muted-foreground xl:grid-cols-7">
                        <div>Назва</div>
                        <div className="hidden xl:block">Курс</div>
                        <div className="hidden xl:block">Уроки</div>
                        <div className="hidden xl:block">Тривалість</div>
                        <div className="hidden xl:block">Ціна</div>
                        <div className="hidden xl:block">Статус</div>
                        <div className="text-right xl:text-center">Дії</div>
                    </Card>
                }
                renderRow={(plan: SubscriptionPlan, open, onToggle) => (
                    <Card
                        onClick={onToggle}
                        className="grid cursor-pointer grid-cols-2 items-center px-4 py-3 transition xl:grid-cols-7"
                    >
                        <div className="min-w-0">
                            <div className="break-words font-medium">
                                {plan.name ? plan.name : "Немає"}
                            </div>
                            <div className="mt-1 line-clamp-1 text-xs text-muted-foreground xl:hidden">
                                {plan.course?.title ? plan.course.title : "Немає"}
                            </div>
                        </div>

                        <div className="hidden break-words xl:block">
                            {plan.course?.title ? plan.course.title : "Немає"}
                        </div>

                        <div className="hidden xl:block">
                            {plan.lessons_count !== undefined && plan.lessons_count !== null
                                ? `${plan.lessons_count} уроків`
                                : "Немає"}
                        </div>

                        <div className="hidden xl:block">
                            {plan.duration_days !== undefined && plan.duration_days !== null
                                ? `${plan.duration_days} днів`
                                : "Немає"}
                        </div>

                        <div className="hidden xl:block">
                            {plan.price !== undefined && plan.price !== null
                                ? `${String(plan.price)} ${plan.currency?.symbol ? plan.currency.symbol : ""}`
                                : "Немає"}
                        </div>

                        <div className="hidden xl:block">
                            <span
                                className={
                                    plan.is_active
                                        ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600"
                                        : "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                                }
                            >
                                {plan.is_active ? "Активний" : "Неактивний"}
                            </span>
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
                                            <Link
                                                href={`/dashboard/manager/subscription/edit/${plan.id}/`}
                                                className="flex cursor-pointer items-center px-2 py-1.5 text-sm outline-none"
                                            >
                                                Редагувати
                                            </Link>
                                        ),
                                    },
                                    {
                                        key: "delete",
                                        label: "",
                                        content: (
                                            <DeleteSubscriptionPlanDialog
                                                id={plan.id}
                                                name={plan.name}
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
                renderMobileDetails={(plan: SubscriptionPlan) => (
                    <div className="space-y-3">
                        <Row label="Опис" value={plan.description ? plan.description : "Немає"} />
                        <Row label="Курс" value={plan.course?.title ? plan.course.title : "Немає"} />
                        <Row
                            label="Кількість уроків"
                            value={
                                plan.lessons_count !== undefined && plan.lessons_count !== null
                                    ? String(plan.lessons_count)
                                    : "Немає"
                            }
                        />
                        <Row
                            label="Тривалість"
                            value={
                                plan.duration_days !== undefined && plan.duration_days !== null
                                    ? `${plan.duration_days} днів`
                                    : "Немає"
                            }
                        />
                        <Row
                            label="Пільговий період"
                            value={
                                plan.grace_period_days !== undefined && plan.grace_period_days !== null
                                    ? `${plan.grace_period_days} днів`
                                    : "Немає"
                            }
                        />
                        <Row
                            label="Ціна"
                            value={
                                plan.price !== undefined && plan.price !== null
                                    ? `${String(plan.price)} ${plan.currency?.symbol ? plan.currency.symbol : ""}`
                                    : "Немає"
                            }
                        />
                        <Row
                            label="Тип уроку"
                            value={
                                plan.lesson_type !== undefined && plan.lesson_type !== null
                                    ? String(plan.lesson_type)
                                    : "Немає"
                            }
                        />
                        <Row label="Статус" value={plan.is_active ? "Активний" : "Неактивний"} />
                    </div>
                )}
            />
        </div>
    );
}