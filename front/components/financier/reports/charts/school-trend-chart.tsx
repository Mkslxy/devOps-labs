"use client";

import {useMemo} from "react";
import {Line, LineChart, CartesianGrid, XAxis, YAxis} from "recharts";

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig} from "@/components/ui/chart";
import {useAllPnlTransactions} from "@/hooks/use-pnl-paginated";
import {lastNMonthsKeys, monthKeyFromISO, toNumberMoney} from "@/libs/pnl-analytics";
import {TransactionTypeEnum} from "@/store/pnl/pnl.type";
import {formatMoneyShort} from "./balance-trend-chart";

type Props = {
    selectedSchoolId: number | null;
    currencyId: number;
    currencyCode: string;
};

const chartConfig = {
    revenue: {label: "Дохід", color: "var(--chart-2)"},
    expenses: {label: "Витрати", color: "var(--chart-3)"},
} satisfies ChartConfig;


export function SchoolTrendChart({selectedSchoolId, currencyId, currencyCode}: Props) {
    const {items, isLoading} = useAllPnlTransactions({
        currency: currencyId,
        createdAfter: undefined,
        createdBefore: undefined,
    });

    const data = useMemo(() => {
        if (!selectedSchoolId) return [];

        const months = lastNMonthsKeys(12);
        const mapIncome = new Map<string, number>();
        const mapExpense = new Map<string, number>();

        for (const t of items) {
            if (!t.school || t.school.id !== selectedSchoolId) continue;
            const k = monthKeyFromISO(t.created_at);
            const amount = Math.abs(toNumberMoney(t.amount));

            if (t.type === TransactionTypeEnum.income) {
                mapIncome.set(k, (mapIncome.get(k) ?? 0) + amount);
            } else {
                mapExpense.set(k, (mapExpense.get(k) ?? 0) + amount);
            }
        }

        return months.map((m) => ({
            month: m.label,
            revenue: mapIncome.get(m.key) ?? 0,
            expenses: mapExpense.get(m.key) ?? 0,
        }));
    }, [items, selectedSchoolId]);

    if (!selectedSchoolId) {
        return (
            <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                    <CardTitle>Аналітика школи</CardTitle>
                    <CardDescription>Обери школу зі списку, щоб побачити тренд</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                        Обери школу нижче, щоб подивитися дохід та витрати за 12 місяців
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Деталі школи</CardTitle>
                <CardDescription>Дохід та витрати за 12 місяців ({currencyCode})</CardDescription>
            </CardHeader>

            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={data} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40"/>
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} className="text-xs"/>
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            className="text-xs"
                            width={70}
                            tickFormatter={(v) => formatMoneyShort(Number(v), currencyCode)}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(label) => `Місяць: ${label}`}
                                    formatter={(value, name) => {
                                        const label = name === "revenue" ? "Дохід" : "Витрати";
                                        return (
                                            <span>{label}: <span
                                                className="font-mono font-medium">{formatMoneyShort(Number(value), currencyCode)}</span>
                                            </span>
                                        );
                                    }}
                                />
                            }
                        />
                        <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2.5}
                              dot={false} activeDot={{r: 5, strokeWidth: 2}}/>
                        <Line dataKey="expenses" type="monotone" stroke="var(--color-expenses)" strokeWidth={2.5}
                              dot={false} strokeDasharray="6 3" activeDot={{r: 5, strokeWidth: 2}}/>
                    </LineChart>
                </ChartContainer>

                {isLoading ? <div className="mt-3 text-xs text-muted-foreground">Завантаження…</div> : null}
            </CardContent>
        </Card>
    );
}