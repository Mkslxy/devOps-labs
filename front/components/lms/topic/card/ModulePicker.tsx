"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

import { useGetModulesQuery } from "@/store/module/module.api";
import type { Module } from "@/store/module/module.type";

interface Props {
    value: number | null;
    onChange: (id: number | null) => void;
}

export default function ModulePicker({ value, onChange }: Props) {
    const { data, isLoading } = useGetModulesQuery({ page_size: 50 });
    const [query, setQuery] = useState("");

    const modules: Module[] = data?.results || [];

    const selected =
        value == null ? null : modules.find((m) => m.id === value) ?? null;

    const filtered = modules.filter((m) =>
        (m.title || "").toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <Input
                placeholder="Пошук модуля..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            <div className="max-h-64 overflow-y-auto border rounded-xl divide-y bg-background">
                {filtered.map((m) => {
                    const active = m.id === value;

                    return (
                        <div
                            key={m.id}
                            onClick={() => onChange(m.id)}
                            className={`px-4 py-3 cursor-pointer flex justify-between items-start ${
                                active ? "bg-muted" : "hover:bg-muted/50"
                            }`}
                        >
                            <div className="space-y-1">
                                <p className="font-medium text-sm leading-tight">
                                    {m.title || "Немає"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Курс: {m.course_data.title ?? "Немає"} <br/>Створений:{" "}
                                    {typeof m.created_by === "object" && m.created_by
                                        ? m.created_by.full_name || m.created_by.email
                                        : m.created_by ?? "Немає"}
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
                        <p className="font-medium text-sm">{selected.title || "Немає"}</p>

                        <X
                            className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-destructive"
                            onClick={() => onChange(null)}
                        />
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Курс: {selected.course_data.title ?? "Немає"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Створений:{" "}
                        {typeof selected.created_by === "object" && selected.created_by
                            ? selected.created_by.full_name || selected.created_by.email
                            : selected.created_by ?? "Немає"}
                    </div>
                </Card>
            )}
        </div>
    );
}