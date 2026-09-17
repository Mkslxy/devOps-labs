"use client";

import { useMemo } from "react";
import { Cell, Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useGetPnlSchoolBalanceQuery } from "@/store/pnl/pnl.api";
import { toNumberMoney } from "@/libs/pnl-analytics";
import { formatMoneyShort } from "./balance-trend-chart";

type Props = {
    currencyId: number;
    currencyCode: string;
};

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function SchoolDistributionChart({ currencyId, currencyCode }: Props) {
    const { data } = useGetPnlSchoolBalanceQuery({
        currency: currencyId,
        ordering: "-balance",
    });

    const items = useMemo(() => {
        const rows = data?.results ?? [];
        return rows.slice(0, 8).map((sb, idx) => {
            const shortName = sb.school.name.split(" ").slice(0, 2).join(" ");
            return {
                key: sb.id,
                name: shortName,
                fullName: sb.school.name,
                value: toNumberMoney(sb.balance),
                fill: COLORS[idx % COLORS.length],
            };
        });
    }, [data]);

    const total = useMemo(() => items.reduce((sum, x) => sum + x.value, 0), [items]);

    const chartConfig: ChartConfig = useMemo(() => {
        const entries: Array<[string, { label: string; color: string }]> = items.map((d) => [
            d.name,
            { label: d.fullName, color: d.fill },
        ]);
        return Object.fromEntries(entries);
    }, [items]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Розподіл по школах</CardTitle>
                <CardDescription>Частка балансу по школах ({currencyCode})</CardDescription>
            </CardHeader>

            <CardContent>
                <ChartContainer config={chartConfig} className="mx-auto h-[300px] w-full">
                    <PieChart>
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value) => <span className="font-mono font-medium">{formatMoneyShort(Number(value), currencyCode)}</span>}
                                />
                            }
                        />

                        <Pie
                            data={items}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={70}
                            outerRadius={110}
                            strokeWidth={3}
                            stroke="var(--background)"
                            paddingAngle={2}
                        >
                            {items.map((entry, index) => (
                                <Cell key={String(entry.key)} fill={entry.fill} />
                            ))}

                            <Label
                                content={({ viewBox }) => {
                                    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                                    const cx = Number(viewBox.cx);
                                    const cy = Number(viewBox.cy);

                                    return (
                                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                            <tspan x={cx} y={cy} className="fill-foreground text-xl font-bold font-mono">
                                                {formatMoneyShort(total, currencyCode)}
                                            </tspan>
                                            <tspan x={cx} y={cy + 22} className="fill-muted-foreground text-xs">
                                                Всього
                                            </tspan>
                                        </text>
                                    );
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    {items.map((entry) => (
                        <div key={String(entry.key)} className="flex items-center gap-1.5">
                            <div className="size-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                            <span className="text-xs text-muted-foreground">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}