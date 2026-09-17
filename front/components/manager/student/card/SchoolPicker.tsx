"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

import type { School } from "@/store/school/school.type";
import { useLazyGetSchoolsQuery } from "@/store/school/school.api";

interface Props {
    value: number[];
    onChange: (ids: number[]) => void;
}

export default function SchoolPicker({ value, onChange }: Props) {
    const [query, setQuery] = useState("");
    const [schools, setSchools] = useState<School[]>([]);
    const [bootLoading, setBootLoading] = useState(true);

    const [fetchSchools, { isFetching }] = useLazyGetSchoolsQuery();

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setBootLoading(true);

            try {
                let page = 1;
                const acc: School[] = [];
                const seen = new Set<number>();

                while (true) {
                    const res = await fetchSchools({
                        page,
                        format: "json",
                    }).unwrap();

                    const chunk: School[] = res?.results ?? [];
                    if (chunk.length === 0) break;

                    let added = 0;
                    for (const s of chunk) {
                        if (!seen.has(s.id)) {
                            seen.add(s.id);
                            acc.push(s);
                            added += 1;
                        }
                    }

                    if (added === 0) break;
                    if (!res?.next) break;

                    page += 1;
                }

                if (!cancelled) setSchools(acc);
            } finally {
                if (!cancelled) setBootLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [fetchSchools]);

    const selectedSchools = useMemo(() => {
        if (!value?.length) return [];
        const set = new Set(value);
        return schools.filter((s) => set.has(s.id));
    }, [schools, value]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return schools;

        return schools.filter((s) => {
            const name = (s.name ?? "").toLowerCase();
            const city = (s.city ?? "").toLowerCase();
            const address = (s.address ?? "").toLowerCase();
            return name.includes(q) || city.includes(q) || address.includes(q);
        });
    }, [schools, query]);

    const loading = bootLoading || isFetching;

    const toggleSchool = (id: number) => {
        const has = value.includes(id);
        onChange(has ? value.filter((x) => x !== id) : [...value, id]);
    };

    const removeSchool = (id: number) => onChange(value.filter((x) => x !== id));

    return (
        <div className="space-y-4">
            <Input
                placeholder="Пошук школи..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            <div className="max-h-64 overflow-y-auto border rounded-xl divide-y bg-background">
                {filtered.map((s) => {
                    const active = value.includes(s.id);

                    return (
                        <div
                            key={s.id}
                            onClick={() => toggleSchool(s.id)}
                            className={`px-4 py-3 cursor-pointer flex justify-between items-start ${
                                active ? "bg-muted" : "hover:bg-muted/50"
                            }`}
                        >
                            <div className="space-y-1">
                                <p className="font-medium text-sm leading-tight">{s.name || "Немає"}</p>

                                <p className="text-xs text-muted-foreground">
                                    Місто: {s.city || "Немає"}
                                    {" · "}
                                    Адреса: {s.address || "Немає"}
                                </p>
                            </div>

                            {active && <span className="text-xs text-primary font-medium">Обрано</span>}
                        </div>
                    );
                })}

                {!loading && filtered.length === 0 && (
                    <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        Нічого не знайдено
                    </div>
                )}

                {loading && schools.length === 0 && (
                    <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        Завантажуємо школи...
                    </div>
                )}
            </div>

            {selectedSchools.length > 0 && (
                <div className="space-y-2">
                    {selectedSchools.map((s) => (
                        <Card key={s.id} className="p-4 gap-0 bg-muted/30 space-y-2">
                            <div className="flex justify-between items-start">
                                <p className="font-medium text-sm">{s.name || "Немає"}</p>

                                <X
                                    className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-destructive"
                                    onClick={() => removeSchool(s.id)}
                                />
                            </div>

                            <div className="flex flex-col md:flex-row gap-2">
                                <div className="text-xs text-muted-foreground">Місто: {s.city || "Немає"}</div>
                                <div className="text-xs text-muted-foreground">Адреса: {s.address || "Немає"}</div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}