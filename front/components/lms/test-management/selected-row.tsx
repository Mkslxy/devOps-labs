import React from "react";
import { cn } from "@/libs/utils";

type Props = {
    active?: boolean;
    onSelect?: () => void;
    children: React.ReactNode;
    className?: string;
};

export function SelectedRow({ active, onSelect, children, className }: Props) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect?.();
            }}
            className={cn(
                "w-full rounded-lg border px-3 py-2 text-left transition cursor-pointer select-none",
                active ? "bg-muted/30 border-primary/40" : "bg-card hover:bg-muted/20",
                className
            )}
        >
            {children}
        </div>
    );
}
