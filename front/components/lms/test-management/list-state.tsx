"use client";

import React from "react";

type Props = {
    loading?: boolean;
    empty?: boolean;
    emptyText?: string;
    loadingText?: string;
    children: React.ReactNode;
};

export function ListState({
                              loading,
                              empty,
                              emptyText = "Нічого немає.",
                              loadingText = "Завантаження...",
                              children,
                          }: Props) {
    if (loading) return <div className="text-sm text-muted-foreground p-3">{loadingText}</div>;
    if (empty) return <div className="text-sm text-muted-foreground p-3">{emptyText}</div>;
    return <>{children}</>;
}
