"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { daysLeft } from "../lib/date";

export function DeadlineBadge({ deadline }: { deadline?: string | null }) {
    const left = daysLeft(deadline);
    const label =
        left === null
            ? "Немає"
            : left < 0
                ? `Прострочено на ${Math.abs(left)} дн.`
                : left === 0
                    ? "Сьогодні"
                    : `${left} дн.`;

    const variant: "secondary" | "default" | "destructive" =
        left === null ? "secondary" : left < 0 ? "destructive" : left <= 2 ? "default" : "secondary";

    return (
        <Badge variant={variant} className="whitespace-nowrap">
            <Clock className="w-3 h-3 mr-1" />
            {label}
        </Badge>
    );
}
