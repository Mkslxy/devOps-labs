"use client";

import React from "react";

export function StatPill({
                             label,
                             value,
                             icon,
                         }: {
    label: string;
    value: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2">
            <div className="text-muted-foreground">{icon}</div>
            <div className="leading-tight">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-sm font-semibold">{value}</div>
            </div>
        </div>
    );
}