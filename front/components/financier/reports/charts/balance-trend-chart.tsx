"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useGetPnlCompanyBalanceQuery } from "@/store/pnl/pnl.api";
import type { CompanyBalance } from "@/store/pnl/pnl.type";
import { lastNMonthsKeys, monthKeyFromISO, toNumberMoney } from "@/libs/pnl-analytics";

type Props = {
    currencyId: number;
    currencyCode: string;
};

const chartConfig = {
    balance: { label: "Баланс", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function formatMoneyShort(value: number, currencyCode: string) {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M ${currencyCode}`;
    if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K ${currencyCode}`;
    return `${sign}${abs.toFixed(0)} ${currencyCode}`;
}

export function BalanceTrendChart({ currencyId, currencyCode }: Props) {
    const { data, isFetching } = useGetPnlCompanyBalanceQuery({
        currency: currencyId,
        ordering: "created_at",
    });

    const points = useMemo(() => {
        const months = lastNMonthsKeys(12);
        const map = new Map<string, CompanyBalance[]>();

        for (const b of data?.results ?? []) {
            if (!b.created_at) continue;
            const k = monthKeyFromISO(b.created_at);
            const arr = map.get(k) ?? [];
            arr.push(b);
            map.set(k, arr);
        }

        return months.map((m) => {
            const arr = map.get(m.key) ?? [];
            const last = arr.length ? arr[arr.length - 1] : null;

            return {
                month: m.label,
                balance: toNumberMoney(last?.balance),
            };
        });
    }, [data]);

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Тренд балансу</CardTitle>
                <CardDescription>Баланс компанії за останні 12 місяців ({currencyCode})</CardDescription>
            </CardHeader>

            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <AreaChart data={points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />

                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
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
                                    formatter={(value) => (
                                        <span>
                      Баланс: <span className="font-mono font-medium">{formatMoneyShort(Number(value), currencyCode)}</span>
                    </span>
                                    )}
                                />
                            }
                        />

                        <Area dataKey="balance" type="monotone" fill="url(#fillBalance)" stroke="var(--color-balance)" strokeWidth={2} />
                    </AreaChart>
                </ChartContainer>

                {isFetching ? (
                    <div className="mt-3 text-xs text-muted-foreground">Завантаження даних…</div>
                ) : null}
            </CardContent>
        </Card>
    );
}