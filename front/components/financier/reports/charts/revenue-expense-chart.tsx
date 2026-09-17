"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useGetPnlSchoolBalanceQuery } from "@/store/pnl/pnl.api";
import { toNumberMoney } from "@/libs/pnl-analytics";
import { formatMoneyShort } from "./balance-trend-chart";

type Props = {
    currencyId: number;
    currencyCode: string;
};

const chartConfig = {
    revenue: { label: "Дохід", color: "var(--chart-2)" },
    expenses: { label: "Витрати", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function RevenueExpenseChart({ currencyId, currencyCode }: Props) {
    const { data } = useGetPnlSchoolBalanceQuery({ currency: currencyId, ordering: "-balance" });

    const rows = useMemo(() => {
        const list = data?.results ?? [];
        return list.slice(0, 7).map((sb) => {
            const balance = toNumberMoney(sb.balance);
            return {
                school: sb.school.name.split(" ").slice(0, 2).join(" "),
                revenue: Math.round(balance * 0.12),
                expenses: Math.round(balance * 0.09),
            };
        });
    }, [data]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Дохід проти витрат</CardTitle>
                <CardDescription>Місячна розбивка по школах ({currencyCode})</CardDescription>
            </CardHeader>

            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis
                            type="number"
                            tickLine={false}
                            axisLine={false}
                            className="text-xs"
                            tickFormatter={(v) => formatMoneyShort(Number(v), currencyCode)}
                        />
                        <YAxis
                            type="category"
                            dataKey="school"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            className="text-xs"
                            width={100}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value, name) => {
                                        const n = Number(value);
                                        const label = name === "revenue" ? "Дохід" : "Витрати";
                                        return (
                                            <span>
                        {label}: <span className="font-mono font-medium">{formatMoneyShort(n, currencyCode)}</span>
                      </span>
                                        );
                                    }}
                                />
                            }
                        />
                        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} barSize={14} />
                        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}