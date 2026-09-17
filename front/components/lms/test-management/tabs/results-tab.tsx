import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeaderSection } from "../header-section";
import { ListState } from "../list-state";

import type { TeacherAttemptList } from "@/store/test-management/test-management.type";
import type { AttemptStatusEnum } from "@/store/test-management/test-management.type";
import { ATTEMPT_STATUS_LABELS } from "@/store/test-management/test-management.labels";
import {formatDateTime} from "@/app/dashboard/manager/leads/page";

type Props = {
    results: TeacherAttemptList[];
    loading?: boolean;
    onFilters?: () => void;
    onOpen?: (id: number) => void;
};

function safe(v: unknown): string {
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
    return "Немає";
}

export function ResultsTab({ results, loading, onFilters, onOpen }: Props) {
    return (
        <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
                <HeaderSection
                    title="Результати студентів"
                    description="Перевірка відповідей."
                    actionLabel="Фільтри"
                    actionVariant="outline"
                    onAction={onFilters}
                >
                    <ScrollArea className="h-[560px]">
                        <div className="p-3 grid gap-2">
                            <ListState
                                loading={loading}
                                empty={!loading && results.length === 0}
                                emptyText="Результатів ще немає."
                                loadingText="Завантаження результатів..."
                            >
                                {results.map((r) => {
                                    const studentLabel = r.student_name?.trim()
                                        ? r.student_name
                                        : r.student_email?.trim()
                                            ? r.student_email
                                            : `ID: ${r.student_id}`;

                                    return (
                                        <div
                                            key={r.id}
                                            className="rounded-lg border bg-card px-3 py-2 flex items-start justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium truncate">
                                                    {safe(studentLabel)}
                                                    {" • "}
                                                    {safe(r.test_title)}
                                                    {" • "}
                                                    Спроба #{r.id}
                                                </div>

                                                <div className="text-xs text-muted-foreground">
                                                    Початок: {formatDateTime(r.started_at)} {" • "}
                                                    Завершено: {formatDateTime(r.finished_at)}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={r.status === "completed" ? "secondary" : "outline"}
                                                    className="rounded-full"
                                                >
                                                    {ATTEMPT_STATUS_LABELS[r.status as AttemptStatusEnum] ?? safe(r.status)}
                                                </Badge>

                                                <Badge variant="outline" className="rounded-full">
                                                    {r.grade?.value ?? "Немає"} / {r.max_possible_score ?? "Немає"}
                                                </Badge>

                                                <Badge
                                                    variant={r.is_passed ? "secondary" : "outline"}
                                                    className="rounded-full"
                                                >
                                                    {r.is_passed ? "Складено" : "Не складено"}
                                                </Badge>

                                                <Button size="sm" variant="outline" onClick={() => onOpen?.(r.id)}>
                                                    Відкрити
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </ListState>
                        </div>
                    </ScrollArea>
                </HeaderSection>
            </div>
        </div>
    );
}
