"use client";

import React from "react";
import type { TooltipProps } from "recharts";

type Props = TooltipProps<number, string> & {
    valueSuffix?: string;
    valueLabel?: string;
};

export function ChartTooltip({
                                 active,
                                 payload,
                                 label,
                                 valueSuffix = "",
                                 valueLabel,
                             }: Props) {
    if (!active || !payload?.length) return null;

    const p = payload[0];
    const val = p?.value;

    return (
        <div className="rounded-md border bg-background px-3 py-2 text-xs text-foreground shadow-md">
            <div className="mb-1 font-medium">{String(label ?? "")}</div>

            <div className="flex items-center gap-2">
                <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: (p as any)?.color ?? "hsl(var(--foreground))" }}
                />
                <span className="text-muted-foreground">
                    {valueLabel ? `${valueLabel}: ` : ""}
                    <span className="text-foreground font-medium">
                        {typeof val === "number" ? val.toFixed(1) : String(val ?? "")}
                        {valueSuffix}
                    </span>
                </span>
            </div>
        </div>
    );
}
