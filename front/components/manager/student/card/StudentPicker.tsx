"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useGetStudentsQuery } from "@/store/users/user.api";

interface Props {
    value: number[];
    onChange: (ids: number[]) => void;
}

export default function StudentPicker({ value, onChange }: Props) {
    const { data } = useGetStudentsQuery({ page:1,page_size:50,});
    const [query, setQuery] = useState("");

    const students = data?.results || [];

    const filtered = students.filter((s: any) =>
        s.full_name.toLowerCase().includes(query.toLowerCase())
    );

    const toggle = (id: number) => {
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <Input
                    placeholder="Пошук студента..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                {filtered.map((s: any) => {
                    const active = value.includes(s.id);

                    return (
                        <div
                            key={s.id}
                            onClick={() => toggle(s.id)}
                            className={`px-4 py-2 cursor-pointer flex justify-between items-center
                                ${active ? "bg-muted" : "hover:bg-muted/50"}
                            `}
                        >
                            <div>
                                <p className="font-medium text-sm">
                                    {s.full_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {s.email}
                                </p>
                            </div>

                            {active && (
                                <span className="text-xs text-primary">
                                    Додано
                                </span>
                            )}
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        Нічого не знайдено
                    </div>
                )}
            </div>

            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {students
                        .filter((s: any) => value.includes(s.id))
                        .map((s: any) => (
                            <Badge
                                key={s.id}
                                variant="secondary"
                                className="flex items-center gap-1"
                            >
                                {s.full_name}
                                <button
                                    type="button"
                                    className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-green-900"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggle(s.id);
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                </div>
            )}
        </div>
    );
}
