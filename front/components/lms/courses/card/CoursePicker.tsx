"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import type { Course } from "@/store/groups/group.type";
import {useLazyGetCoursesQuery} from "@/store/groups/group.api";

interface Props {
    value: number | null;
    onChange: (id: number | null) => void;
}

const PAGE_SIZE = 50;

export default function CoursePicker({ value, onChange }: Props) {
    const [query, setQuery] = useState("");
    const [courses, setCourses] = useState<Course[]>([]);
    const [bootLoading, setBootLoading] = useState(true);

    const [fetchCourses, { isFetching }] = useLazyGetCoursesQuery();

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setBootLoading(true);

            try {
                let page = 1;
                const acc: Course[] = [];
                const seen = new Set<number>();

                while (true) {
                    const res = await fetchCourses({ page, page_size: PAGE_SIZE }).unwrap();
                    const chunk: Course[] = res?.results ?? [];

                    if (chunk.length === 0) break;

                    let added = 0;
                    for (const c of chunk) {
                        if (!seen.has(c.id)) {
                            seen.add(c.id);
                            acc.push(c);
                            added += 1;
                        }
                    }

                    if (added === 0) break;

                    if (!res?.next) break;
                    page += 1;
                }

                if (!cancelled) setCourses(acc);
            } finally {
                if (!cancelled) setBootLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [fetchCourses]);

    const selectedCourse =
        value == null ? null : courses.find((c) => c.id === value) ?? null;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return courses;
        return courses.filter((c) => (c.title ?? "").toLowerCase().includes(q));
    }, [courses, query]);

    const loading = bootLoading || isFetching;

    return (
        <div className="space-y-4">
            <Input
                placeholder="Пошук курсу..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            <div className="max-h-64 overflow-y-auto border rounded-xl divide-y bg-background">
                {filtered.map((c) => {
                    const active = c.id === value;

                    return (
                        <div
                            key={c.id}
                            onClick={() => onChange(c.id)}
                            className={`px-4 py-3 cursor-pointer flex justify-between items-start ${
                                active ? "bg-muted" : "hover:bg-muted/50"
                            }`}
                        >
                            <div className="space-y-1">
                                <p className="font-medium text-sm leading-tight">
                                    {c.title || "Немає"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Рівень: {c.level || "Немає"} · Ціна:{" "}
                                    {c.price ? `${c.price} ₴` : "Немає"}
                                </p>
                            </div>

                            {active && (
                                <span className="text-xs text-primary font-medium">Обрано</span>
                            )}
                        </div>
                    );
                })}

                {!loading && filtered.length === 0 && (
                    <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        Нічого не знайдено
                    </div>
                )}

                {loading && courses.length === 0 && (
                    <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        Завантажуємо курси...
                    </div>
                )}
            </div>

            {selectedCourse && (
                <Card className="p-4 bg-muted/30 space-y-2 gap-0">
                    <div className="flex justify-between items-start">
                        <p className="font-medium text-sm">
                            {selectedCourse.title || "Немає"}
                        </p>

                        <X
                            className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-destructive"
                            onClick={() => onChange(null)}
                        />
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Рівень: {selectedCourse.level || "Немає"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Ціна: {selectedCourse.price ? `${selectedCourse.price} ₴` : "Немає"}
                    </div>
                </Card>
            )}
        </div>
    );
}