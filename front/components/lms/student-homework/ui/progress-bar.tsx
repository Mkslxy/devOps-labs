"use client";

import React from "react";

export function ProgressBar({ completed, total }: { completed: number; total: number }) {
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Виконано</span>
                <span className="font-medium">
          {completed}/{total}
        </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}