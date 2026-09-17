"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { useGetTopicsQuery } from "@/store/topic/topic.api";
import type { Topic } from "@/store/topic/topic.type";

interface Props {
    value: number | null;
    onChange: (id: number | null) => void;
    moduleId?: number | null;
}

export default function TopicPicker({ value, onChange, moduleId }: Props) {
    const { data, isLoading } = useGetTopicsQuery({
        page_size: 200,
        ...(moduleId ? { module: moduleId } : {}),
    });

    const [query, setQuery] = useState("");

    const topics: Topic[] = data?.results || [];

    const selected =
        value == null ? null : topics.find((t) => t.id === value) ?? null;

    const filtered = topics.filter((t) => {
        const q = query.toLowerCase();
        return (
            t.title.toLowerCase().includes(q) ||
            (t.content_description || "").toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-4">
            <Input
                placeholder="Пошук теми..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            <div className="max-h-64 overflow-y-auto border rounded-xl divide-y bg-background">
                {filtered.map((t) => {
                    const active = t.id === value;

                    return (
                        <div
                            key={t.id}
                            onClick={() => onChange(t.id)}
                            className={`px-4 py-3 cursor-pointer flex justify-between items-start ${
                                active ? "bg-muted" : "hover:bg-muted/50"
                            }`}
                        >
                            <div className="space-y-1">
                                <p className="font-medium text-sm leading-tight">
                                    {t.title || "Немає"}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {t.content_description || "Немає"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Модуль: {t.module_data?.title ?? "Немає"}
                                </p>
                            </div>

                            {active && (
                                <span className="text-xs text-primary font-medium">Обрано</span>
                            )}
                        </div>
                    );
                })}

                {!isLoading && filtered.length === 0 && (
                    <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        Нічого не знайдено
                    </div>
                )}
            </div>

            {selected && (
                <Card className="p-4 bg-muted/30 space-y-2 gap-0">
                    <div className="flex justify-between items-start">
                        <p className="font-medium text-sm">{selected.title}</p>

                        <X
                            className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-destructive"
                            onClick={() => onChange(null)}
                        />
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Модуль: {selected.module_data?.title ?? "Немає"}
                    </div>

                    {selected.content_description ? (
                        <div className="text-xs text-muted-foreground">
                            {selected.content_description}
                        </div>
                    ) : null}
                </Card>
            )}
        </div>
    );
}
