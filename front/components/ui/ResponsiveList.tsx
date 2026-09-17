"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PaginationController } from "@/components/ui/PaginationController";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { AppEmptyState, AppLoadingState } from "@/components/ui/app-state";

interface ResponsiveListProps<T> {
    data?: { results: T[]; count?: number; };
    isLoading: boolean;
    header: React.ReactNode;
    renderRow: (item: T, open: boolean, onToggle: () => void) => React.ReactNode;
    renderMobileDetails: (item: T) => React.ReactNode;
    getId: (item: T) => number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    emptyTitle?: string;
    emptyDescription?: string;
}

export function ResponsiveList<T>({
                                      data,
                                      isLoading,
                                      header,
                                      renderRow,
                                      renderMobileDetails,
                                      getId,
                                      pageSize,
                                      page,
                                      onPageChange,
                                      emptyTitle = "Немає даних",
                                      emptyDescription = "Поки що немає записів для відображення.",
                                  }: ResponsiveListProps<T>) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const isDesktop = useMediaQuery("(min-width: 1280px)");

    if (isLoading) {
        return (
            <AppLoadingState />
        );
    }

    if (!data?.results?.length) {
        return (
            <div className="space-y-3">
                {header}
                <AppEmptyState title={emptyTitle} description={emptyDescription} />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {header}

            {data?.results.map((item) => {
                const id = getId(item);
                const open = expandedId === id;

                const toggle = () => {
                    if (isDesktop) return;
                    setExpandedId(open ? null : id);
                };

                return (
                    <div key={id}>
                        {renderRow(item, open, toggle)}

                        {open && !isDesktop && (
                            <Card className="bg-muted/50 px-4 py-3 text-sm shadow-none">
                                {renderMobileDetails(item)}
                            </Card>
                        )}
                    </div>
                );
            })}

            {data?.count !== undefined &&
                data.count > 0 &&
                page &&
                pageSize &&
                onPageChange && (
                    <PaginationController
                        page={page}
                        pageSize={pageSize}
                        totalCount={data.count}
                        onPageChange={onPageChange}
                    />
            )}
        </div>
    );
}
