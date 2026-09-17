"use client";

import React, { useMemo } from "react";
import { useMediaQuery } from "@/components/calendar/hooks";
import {
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BookOpen, CheckCircle2, Percent, Users } from "lucide-react";

import type { StudentStats } from "@/store/stats/stats.type";
import { clampPercent, dictToChartData } from "@/libs/utils";
import {TypeEnum} from "@/store/test-management/test-management.type";
import {TYPE_LABELS} from "@/store/test-management/test-management.labels";
import {ChartTooltip} from "@/components/charts/ChartTooltip";

type Props = {
    data: StudentStats;
};

const QUESTION_TYPE_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
];

const ATTENDANCE_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--destructive))",
];

export function StudentStatsDashboard({ data }: Props) {
    const attendanceData = useMemo(() => {
        const a = data.attendance;
        return [
            { name: "Присутній", value: clampPercent(a.present_percent) },
            { name: "Запізнення", value: clampPercent(a.late_percent) },
            { name: "Відсутній", value: clampPercent(a.absent_percent) },
        ];
    }, [data.attendance]);

    const isMobile = useMediaQuery("(max-width: 480px)");

    const pieHeight = isMobile ? 240 : 320;
    const innerR = isMobile ? 46 : 70;
    const outerR = isMobile ? 78 : 110;

    const distributionData = useMemo(() => {
        return dictToChartData(data.tests.distribution, "count");
    }, [data.tests.distribution]);

    const byQuestionTypeData = useMemo(() => {
        const allTypes: TypeEnum[] = [
            TypeEnum.single_choice,
            TypeEnum.multiple_choice,
            TypeEnum.open_text,
            TypeEnum.fill_in_the_blank,
            TypeEnum.matching,
            TypeEnum.ordering,
        ];

        const src = data.tests.by_question_type ?? {};

        return allTypes.map((type) => ({
            name: TYPE_LABELS[type] ?? type,
            percent: clampPercent(Number((src as Record<string, unknown>)[type] ?? 0)),
        }));
    }, [data.tests.by_question_type]);

    const overall = clampPercent(data.overall_score);
    const avgTest = clampPercent(data.tests.avg_percent);
    const hwAvg = Number(data.homework.avg_score ?? 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Загальний результат</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overall.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Підсумкова оцінка</p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Середній % по тестах</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgTest.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Спроб: {data.tests.taken}, Закінчено: {data.tests.completed}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Домашні завдання</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{hwAvg.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Середній бал</p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Успішні тести</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.tests.passed}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Успішні тести
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle>Відвідуваність</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2.5 sm:px-6 overflow-hidden">
                        <ResponsiveContainer width="100%" height={pieHeight}>
                            <PieChart>
                                <Tooltip
                                    cursor={{ fill: "hsl(var(--muted))" }}
                                    wrapperStyle={{ zIndex: 50, outline: "none" }}
                                    content={<ChartTooltip valueLabel="К-сть" />}
                                />
                                <Pie
                                    data={attendanceData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={innerR}
                                    outerRadius={outerR}
                                    paddingAngle={3}
                                >
                                    {attendanceData.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={ATTENDANCE_COLORS[i]}
                                            opacity={0.9}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                            <Users className="h-4 w-4 shrink-0" />
                            <span className="leading-5">
                                Присутній {attendanceData[0]?.value?.toFixed?.(1) ?? "0"}%• Запізнення{" "}
                                {attendanceData[1]?.value?.toFixed?.(1) ?? "0"}% • Відсутній{" "}
                                {attendanceData[2]?.value?.toFixed?.(1) ?? "0"}%
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle>Розподіл результатів тестів</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2.5 sm:px-6">
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={distributionData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                <CartesianGrid
                                    stroke="hsl(var(--border))"
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
                                <XAxis dataKey="name" fontSize={11} tickMargin={8} axisLine={false} tickLine={false} />
                                <YAxis fontSize={11} tickMargin={8} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: "hsl(var(--muted))" }}
                                    wrapperStyle={{ zIndex: 50, outline: "none" }}
                                    content={<ChartTooltip valueLabel="К-сть" />}
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[6, 6, 0, 0]}
                                    fill="hsl(var(--primary))"
                                    opacity={0.85}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle>Успішність за типами питань</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2.5 sm:px-6">
                        {isMobile ? (
                            <ResponsiveContainer width="100%" height={360}>
                                <BarChart
                                    data={byQuestionTypeData}
                                    layout="vertical"
                                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                                >
                                    <CartesianGrid
                                        stroke="hsl(var(--border))"
                                        strokeDasharray="3 3"
                                        horizontal={false}
                                    />

                                    <XAxis
                                        type="number"
                                        domain={[0, 100]}
                                        tickFormatter={(v) => `${v}%`}
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={11}
                                    />

                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={11}
                                        width={120}
                                    />

                                    <Tooltip
                                        content={<ChartTooltip valueLabel="Успішність" valueSuffix="%" />}
                                    />

                                    <Bar dataKey="percent" radius={[0, 6, 6, 0]}>
                                        {byQuestionTypeData.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={QUESTION_TYPE_COLORS[i % QUESTION_TYPE_COLORS.length]}
                                                opacity={0.85}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart
                                    data={byQuestionTypeData}
                                    margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                                >
                                    <CartesianGrid
                                        stroke="hsl(var(--border))"
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        interval={0}
                                        minTickGap={0}
                                        angle={-25}
                                        textAnchor="end"
                                        height={60}
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={11}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tickFormatter={(v) => `${v}%`}
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={11}
                                    />
                                    <Tooltip
                                        content={<ChartTooltip valueLabel="Успішність" valueSuffix="%" />}
                                    />
                                    <Bar dataKey="percent" radius={[6, 6, 0, 0]}>
                                        {byQuestionTypeData.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={QUESTION_TYPE_COLORS[i % QUESTION_TYPE_COLORS.length]}
                                                opacity={0.85}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {data.group?.percentile != null ? (
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle>Позиція в групі</CardTitle>
                        </CardHeader>
                        <CardContent className="px-2.5 sm:px-6">
                            <div className="text-3xl font-bold">
                                {`${clampPercent(data.group.percentile).toFixed(1)}%`}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Показує, наскільки студент вище/нижче інших у групі.
                            </p>
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </div>
    );
}
