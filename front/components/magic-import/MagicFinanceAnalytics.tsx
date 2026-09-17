"use client";

import React, { useMemo, useState } from "react";
import {
    BarChart3,
    BookOpen,
    Calendar,
    ChevronRight,
    Lightbulb,
    Loader2,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Wallet,
    Zap,
} from "lucide-react";
import {
    Bar,
    BarChart as RechartsBarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useGetMagicFinanceAnalyticsMutation } from "@/store/magic-import/magic-finance.api";
import { MagicFinanceResponse } from "@/store/magic-import/magic-finance.type";

interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{
        value: number;
        name: string;
        color: string;
    }>;
    label?: string;
    currency: string;
}

function ChartTooltip({ active, payload, label, currency }: ChartTooltipProps) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-xl border bg-white px-4 py-3 shadow-xl">
            <p className="mb-2 text-sm font-semibold">{label || "Немає"}</p>

            <div className="space-y-1.5">
                {payload.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />

                        <span className="text-muted-foreground">{item.name}:</span>

                        <span className="font-semibold">
                            {Number(item.value || 0).toLocaleString("uk-UA", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                            })}{" "}
                            {currency}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface MetricCardProps {
    label: string;
    value: string;
    currency?: string;
    status?: "good" | "bad" | "neutral";
    icon?: React.ElementType;
}

function MetricCard({
                        label,
                        value,
                        currency,
                        status = "neutral",
                        icon: Icon,
                    }: MetricCardProps) {
    return (
        <Card className="relative overflow-hidden border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div
                className={
                    status === "good"
                        ? "pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent"
                        : status === "bad"
                            ? "pointer-events-none absolute inset-0 bg-gradient-to-br from-red-50 to-transparent"
                            : "pointer-events-none absolute inset-0 bg-gradient-to-br from-muted/60 to-transparent"
                }
            />

            <div className="relative">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {label}
                    </p>

                    {Icon && (
                        <Icon
                            className={
                                status === "good"
                                    ? "h-4 w-4 text-emerald-600"
                                    : status === "bad"
                                        ? "h-4 w-4 text-red-600"
                                        : "h-4 w-4 text-muted-foreground"
                            }
                        />
                    )}
                </div>

                <div className="mt-3 flex items-end gap-1.5">
                    <p
                        className={
                            status === "good"
                                ? "break-words text-2xl font-bold tracking-tight text-emerald-700"
                                : status === "bad"
                                    ? "break-words text-2xl font-bold tracking-tight text-red-700"
                                    : "break-words text-2xl font-bold tracking-tight text-foreground"
                        }
                    >
                        {value}
                    </p>

                    {currency && (
                        <span className="pb-0.5 text-sm font-medium text-muted-foreground">
                            {currency}
                        </span>
                    )}
                </div>
            </div>
        </Card>
    );
}

interface InsightCardProps {
    title: string;
    items: string[];
    icon: React.ElementType;
    variant: "good" | "bad" | "recommendation";
}

function InsightCard({ title, items, icon: Icon, variant }: InsightCardProps) {
    return (
        <Card className="min-h-[270px] border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div
                    className={
                        variant === "good"
                            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
                            : variant === "bad"
                                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"
                                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
                    }
                >
                    <Icon className="h-5 w-5" />
                </div>

                <h3 className="text-base font-bold">{title}</h3>
            </div>

            <div className="mt-4 space-y-3">
                {items.length ? (
                    items.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 rounded-xl bg-muted/40 p-4 text-sm leading-6 text-muted-foreground"
                        >
                            <ChevronRight
                                className={
                                    variant === "bad"
                                        ? "mt-1 h-4 w-4 shrink-0 text-red-600"
                                        : "mt-1 h-4 w-4 shrink-0 text-emerald-700"
                                }
                            />

                            <span>{item || "Немає"}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">Немає</p>
                )}
            </div>
        </Card>
    );
}

interface SectionTitleProps {
    icon: React.ElementType;
    title: string;
    description: string;
    color?: "green" | "orange";
}

function SectionTitle({
                          icon: Icon,
                          title,
                          description,
                          color = "green",
                      }: SectionTitleProps) {
    return (
        <div className="flex items-center gap-3">
            <div
                className={
                    color === "orange"
                        ? "flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"
                        : "flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
                }
            >
                <Icon className="h-5 w-5" />
            </div>

            <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

export function MagicFinanceAnalytics() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [result, setResult] = useState<MagicFinanceResponse | null>(null);
    const [errorText, setErrorText] = useState("");

    const [getMagicFinanceAnalytics, { isLoading }] =
        useGetMagicFinanceAnalyticsMutation();

    const numberFormatter = useMemo(
        () =>
            new Intl.NumberFormat("uk-UA", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }),
        []
    );

    const pnlEntries = useMemo(() => {
        if (!result?.pnl?.summary) {
            return [];
        }

        return Object.entries(result.pnl.summary);
    }, [result]);

    const booksEntries = useMemo(() => {
        if (!result?.books?.summary) {
            return [];
        }

        return Object.entries(result.books.summary);
    }, [result]);

    const handleSubmit = async () => {
        if (!startDate || !endDate) {
            setErrorText("Оберіть початкову та кінцеву дату");
            return;
        }

        if (endDate < startDate) {
            setErrorText("Кінцева дата не може бути меншою за початкову");
            return;
        }

        try {
            setErrorText("");
            setResult(null);

            const response = await getMagicFinanceAnalytics({
                start_date: startDate,
                end_date: endDate,
            }).unwrap();

            setResult(response);
        } catch (error) {
            const apiError = error as {
                data?: { detail?: string; message?: string } | string;
            };

            setErrorText(
                typeof apiError.data === "string"
                    ? apiError.data
                    : apiError.data?.detail ||
                    apiError.data?.message ||
                    (apiError.data ? JSON.stringify(apiError.data, null, 2) : null) ||
                    "Не вдалося сформувати фінансову аналітику"
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#f7faf8] px-4 py-6 sm:px-6 lg:px-8">
            <div className="space-y-8">
                <Card className="overflow-hidden rounded-3xl border bg-white/95 p-0 shadow-sm">
                    <div className="relative overflow-hidden p-6 lg:p-8">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(34,197,94,0.08),transparent_30%),radial-gradient(circle_at_100%_100%,rgba(34,197,94,0.08),transparent_30%)]" />

                        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/25">
                                    <Sparkles className="h-7 w-7" />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                        AI Фінансова Аналітика
                                    </h1>

                                    <p className="mt-2 max-w-[520px] text-sm leading-7 text-muted-foreground sm:text-base">
                                        Оберіть період для аналізу PnL, витрат, зарплат
                                        викладачів та закупівлі книг.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        Початкова дата
                                    </Label>

                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-12 min-w-[190px] rounded-xl border bg-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        Кінцева дата
                                    </Label>

                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-12 min-w-[190px] rounded-xl border bg-white"
                                    />
                                </div>

                                <Button
                                    size="lg"
                                    className="h-12 cursor-pointer gap-2 rounded-xl bg-emerald-700 px-7 font-semibold text-white shadow-lg shadow-emerald-700/25 hover:bg-emerald-800"
                                    disabled={isLoading || !startDate || !endDate}
                                    onClick={handleSubmit}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Zap className="h-4 w-4" />
                                    )}

                                    {isLoading ? "Аналізую..." : "Згенерувати"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {errorText && (
                    <Card className="rounded-2xl border-destructive bg-red-50 p-5">
                        <p className="font-semibold text-destructive">Помилка</p>

                        <pre className="mt-3 max-h-[220px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-red-200 bg-white p-3 text-xs text-destructive">
                            {errorText}
                        </pre>
                    </Card>
                )}

                {!result && !errorText && !isLoading && (
                    <Card className="rounded-3xl border bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                            <Sparkles className="h-8 w-8" />
                        </div>

                        <h2 className="mt-5 text-lg font-bold">Готові до аналізу</h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                            Оберіть період та натисніть кнопку «Згенерувати», щоб
                            отримати AI-аналітику фінансових даних.
                        </p>
                    </Card>
                )}

                {result && (
                    <div className="space-y-8">
                        <Card className="rounded-3xl border bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                            <BarChart3 className="h-5 w-5" />
                                        </div>

                                        <h2 className="text-lg font-bold">
                                            Короткий висновок
                                        </h2>
                                    </div>

                                    <p className="mt-4 max-w-[820px] text-sm leading-8 text-muted-foreground">
                                        {result.ai_insights?.executive_summary || "Немає"}
                                    </p>
                                </div>

                                <div className="flex w-fit shrink-0 items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm text-muted-foreground shadow-sm">
                                    <Calendar className="h-4 w-4" />

                                    <span>{result.pnl?.period?.start || "Немає"}</span>
                                    <span>—</span>
                                    <span>{result.pnl?.period?.end || "Немає"}</span>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                            <InsightCard
                                title="Сильні сторони"
                                items={result.ai_insights?.strengths ?? []}
                                icon={TrendingUp}
                                variant="good"
                            />

                            <InsightCard
                                title="Слабкі сторони"
                                items={result.ai_insights?.weaknesses ?? []}
                                icon={TrendingDown}
                                variant="bad"
                            />

                            <InsightCard
                                title="Рекомендації"
                                items={result.ai_insights?.recommendations ?? []}
                                icon={Lightbulb}
                                variant="recommendation"
                            />
                        </div>

                        <div className="space-y-6">
                            <SectionTitle
                                icon={Wallet}
                                title="PnL за валютами"
                                description="Доходи, витрати та маржинальність за період."
                            />

                            {pnlEntries.length ? (
                                pnlEntries.map(([currency, metrics]) => {
                                    const revenueTotal = Number(metrics.revenue?.total ?? 0);
                                    const fromPayments = Number(
                                        metrics.revenue?.from_payments ?? 0
                                    );
                                    const fromOther = Number(
                                        metrics.revenue?.from_other ?? 0
                                    );
                                    const teacherSalary = Number(
                                        metrics.cogs?.teachers_salary ?? 0
                                    );
                                    const cogsTotal = Number(metrics.cogs?.total ?? 0);
                                    const operatingExpenses = Number(
                                        metrics.operating_expenses?.total ?? 0
                                    );
                                    const grossProfit = Number(
                                        metrics.gross_profit ?? 0
                                    );
                                    const netProfit = Number(metrics.net_profit ?? 0);
                                    const grossMargin = Number(
                                        metrics.gross_margin_percent ?? 0
                                    );
                                    const netMargin = Number(
                                        metrics.net_margin_percent ?? 0
                                    );

                                    return (
                                        <Card
                                            key={currency}
                                            className="overflow-hidden rounded-3xl border bg-white p-0 shadow-sm"
                                        >
                                            <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-lg font-bold">
                                                        {currency || "Немає"}
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-bold">
                                                            Валюта: {currency || "Немає"}
                                                        </h3>

                                                        <p className="text-sm text-muted-foreground">
                                                            Фінансовий результат за період.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div
                                                    className={
                                                        netProfit >= 0
                                                            ? "flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700"
                                                            : "flex w-fit items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700"
                                                    }
                                                >
                                                    {netProfit >= 0 ? (
                                                        <TrendingUp className="h-4 w-4" />
                                                    ) : (
                                                        <TrendingDown className="h-4 w-4" />
                                                    )}

                                                    {netProfit >= 0 ? "Прибуток" : "Збиток"}:{" "}
                                                    {numberFormatter.format(netProfit)} {currency}
                                                </div>
                                            </div>

                                            <div className="space-y-8 p-6">
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                                    <MetricCard
                                                        label="Загальний дохід"
                                                        value={numberFormatter.format(revenueTotal)}
                                                        currency={currency}
                                                        icon={TrendingUp}
                                                        status={
                                                            revenueTotal > 0
                                                                ? "good"
                                                                : "neutral"
                                                        }
                                                    />

                                                    <MetricCard
                                                        label="Оплати студентів"
                                                        value={numberFormatter.format(fromPayments)}
                                                        currency={currency}
                                                        icon={Wallet}
                                                        status={
                                                            fromPayments > 0
                                                                ? "good"
                                                                : "neutral"
                                                        }
                                                    />

                                                    <MetricCard
                                                        label="Інші доходи"
                                                        value={numberFormatter.format(fromOther)}
                                                        currency={currency}
                                                        status={
                                                            fromOther > 0
                                                                ? "good"
                                                                : "neutral"
                                                        }
                                                    />

                                                    <MetricCard
                                                        label="Зарплати викладачів"
                                                        value={numberFormatter.format(
                                                            teacherSalary
                                                        )}
                                                        currency={currency}
                                                        status={
                                                            teacherSalary > 0
                                                                ? "bad"
                                                                : "neutral"
                                                        }
                                                    />

                                                    <MetricCard
                                                        label="Собівартість"
                                                        value={numberFormatter.format(cogsTotal)}
                                                        currency={currency}
                                                        status={
                                                            cogsTotal > 0 ? "bad" : "neutral"
                                                        }
                                                    />

                                                    <MetricCard
                                                        label="Операційні витрати"
                                                        value={numberFormatter.format(
                                                            operatingExpenses
                                                        )}
                                                        currency={currency}
                                                        status={
                                                            operatingExpenses > 0
                                                                ? "bad"
                                                                : "neutral"
                                                        }
                                                    />

                                                    <MetricCard
                                                        label="Валовий прибуток"
                                                        value={numberFormatter.format(grossProfit)}
                                                        currency={currency}
                                                        status={
                                                            grossProfit >= 0 ? "good" : "bad"
                                                        }
                                                    />

                                                    <MetricCard
                                                        label="Чистий прибуток"
                                                        value={numberFormatter.format(netProfit)}
                                                        currency={currency}
                                                        status={netProfit >= 0 ? "good" : "bad"}
                                                    />

                                                    <MetricCard
                                                        label="Валова маржа"
                                                        value={`${numberFormatter.format(
                                                            grossMargin
                                                        )}%`}
                                                        status={
                                                            grossMargin >= 0 ? "good" : "bad"
                                                        }
                                                        icon={TrendingUp}
                                                    />

                                                    <MetricCard
                                                        label="Чиста маржа"
                                                        value={`${numberFormatter.format(
                                                            netMargin
                                                        )}%`}
                                                        status={netMargin >= 0 ? "good" : "bad"}
                                                        icon={TrendingUp}
                                                    />
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                                        <h4 className="font-bold">
                                                            Динаміка доходів та витрат
                                                        </h4>
                                                    </div>

                                                    {(metrics.chart_data ?? []).length ? (
                                                        <Card className="h-[340px] rounded-2xl border bg-white p-4 shadow-sm">
                                                            <ResponsiveContainer
                                                                width="100%"
                                                                height="100%"
                                                            >
                                                                <RechartsBarChart
                                                                    data={(
                                                                        metrics.chart_data ?? []
                                                                    ).map((item) => ({
                                                                        date:
                                                                            item.date ||
                                                                            "Немає",
                                                                        Дохід: Number(
                                                                            item.income ?? 0
                                                                        ),
                                                                        Витрати: Number(
                                                                            item.expense ?? 0
                                                                        ),
                                                                    }))}
                                                                    margin={{
                                                                        top: 10,
                                                                        right: 20,
                                                                        left: 0,
                                                                        bottom: 0,
                                                                    }}
                                                                >
                                                                    <CartesianGrid
                                                                        strokeDasharray="3 3"
                                                                        stroke="#e5e7eb"
                                                                    />

                                                                    <XAxis
                                                                        dataKey="date"
                                                                        fontSize={12}
                                                                        tickLine={false}
                                                                        axisLine={false}
                                                                    />

                                                                    <YAxis
                                                                        fontSize={12}
                                                                        tickLine={false}
                                                                        axisLine={false}
                                                                        tickFormatter={(value) =>
                                                                            numberFormatter.format(
                                                                                Number(value)
                                                                            )
                                                                        }
                                                                    />

                                                                    <Tooltip
                                                                        content={
                                                                            <ChartTooltip
                                                                                currency={
                                                                                    currency
                                                                                }
                                                                            />
                                                                        }
                                                                    />

                                                                    <Legend
                                                                        wrapperStyle={{
                                                                            paddingTop: 16,
                                                                        }}
                                                                    />

                                                                    <Bar
                                                                        dataKey="Дохід"
                                                                        fill="#22c55e"
                                                                        radius={[8, 8, 0, 0]}
                                                                        maxBarSize={54}
                                                                    />

                                                                    <Bar
                                                                        dataKey="Витрати"
                                                                        fill="#3b82f6"
                                                                        radius={[8, 8, 0, 0]}
                                                                        maxBarSize={54}
                                                                    />
                                                                </RechartsBarChart>
                                                            </ResponsiveContainer>
                                                        </Card>
                                                    ) : (
                                                        <Card className="rounded-2xl border bg-white p-5 text-sm text-muted-foreground">
                                                            Немає даних для графіка
                                                        </Card>
                                                    )}
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                                        <h4 className="font-bold">
                                                            Витрати по категоріях
                                                        </h4>
                                                    </div>

                                                    {(metrics.operating_expenses?.by_category ??
                                                        []
                                                    ).length ? (
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                            {metrics.operating_expenses.by_category.map(
                                                                (item, index) => (
                                                                    <Card
                                                                        key={`${item.category}-${index}`}
                                                                        className="rounded-2xl border bg-white p-5 shadow-sm"
                                                                    >
                                                                        <p className="text-sm font-medium">
                                                                            {item.category ||
                                                                                "Немає"}
                                                                        </p>

                                                                        <p className="mt-3 text-2xl font-bold text-emerald-700">
                                                                            {numberFormatter.format(
                                                                                Number(
                                                                                    item.amount ??
                                                                                    0
                                                                                )
                                                                            )}{" "}
                                                                            <span className="text-sm font-medium text-muted-foreground">
                                                                                {currency}
                                                                            </span>
                                                                        </p>
                                                                    </Card>
                                                                )
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <Card className="rounded-2xl border bg-white p-5 text-sm text-muted-foreground">
                                                            Немає
                                                        </Card>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })
                            ) : (
                                <Card className="rounded-3xl border bg-white p-8 text-center text-muted-foreground shadow-sm">
                                    Немає PnL даних за вибраний період
                                </Card>
                            )}
                        </div>

                        <div className="space-y-6">
                            <SectionTitle
                                icon={BookOpen}
                                title="Закупівля книг"
                                description="Кількість закупок, книг та загальна сума витрат."
                                color="orange"
                            />

                            {booksEntries.length ? (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                    {booksEntries.map(([currency, books]) => (
                                        <Card
                                            key={currency}
                                            className="overflow-hidden rounded-3xl border bg-white p-0 shadow-sm"
                                        >
                                            <div className="relative p-6">
                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent" />

                                                <div className="relative">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                                                                <BookOpen className="h-6 w-6" />
                                                            </div>

                                                            <h3 className="text-xl font-bold">
                                                                {currency || "Немає"}
                                                            </h3>
                                                        </div>

                                                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                                                            Книги
                                                        </span>
                                                    </div>

                                                    <div className="mt-6 space-y-4">
                                                        <div className="rounded-2xl border bg-white/80 p-4">
                                                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                                                Кількість закупок
                                                            </p>

                                                            <p className="mt-2 text-2xl font-bold">
                                                                {numberFormatter.format(
                                                                    Number(
                                                                        books.orders_count ??
                                                                        0
                                                                    )
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-2xl border bg-white/80 p-4">
                                                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                                                Кількість книг
                                                            </p>

                                                            <p className="mt-2 text-2xl font-bold">
                                                                {numberFormatter.format(
                                                                    Number(
                                                                        books.total_books_amount ??
                                                                        0
                                                                    )
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                                                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                                                Витрачено
                                                            </p>

                                                            <p className="mt-2 text-2xl font-bold text-orange-700">
                                                                {numberFormatter.format(
                                                                    Number(
                                                                        books.total_spent ?? 0
                                                                    )
                                                                )}{" "}
                                                                <span className="text-sm font-medium text-muted-foreground">
                                                                    {currency}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="rounded-3xl border bg-white p-8 text-center text-muted-foreground shadow-sm">
                                    Немає закупівель книг за вибраний період
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}