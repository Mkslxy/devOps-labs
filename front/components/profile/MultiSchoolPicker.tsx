"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, MapPin, School as SchoolIcon, X } from "lucide-react";

import type { School } from "@/store/school/school.type";
import { useLazyGetSchoolsQuery } from "@/store/school/school.api";

interface Props {
    value?: number[];
    onChange: (ids: number[]) => void;
    disabled?: boolean;
}

const PAGE_SIZE = 50;

function useDebouncedValue<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(value), delay);
        return () => window.clearTimeout(t);
    }, [value, delay]);

    return debounced;
}

export default function MultiSchoolPicker({ value, onChange, disabled }: Props) {
    const safeValue = Array.isArray(value) ? value : [];

    const [query, setQuery] = useState("");
    const debouncedQuery = useDebouncedValue(query, 300);

    const [list, setList] = useState<School[]>([]);
    const [selectedMap, setSelectedMap] = useState<Map<number, School>>(new Map());

    const [fetchSchools, { isFetching }] = useLazyGetSchoolsQuery();

    // 1) Пошук на бекенді
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await fetchSchools({
                    page: 1,
                    page_size: PAGE_SIZE,
                    format: "json",
                    search: debouncedQuery.trim() || undefined,
                } as any).unwrap();

                if (cancelled) return;
                setList(res?.results ?? []);
            } catch {
                if (cancelled) return;
                setList([]);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery, fetchSchools]);

    // 2) Підтягнути деталі ОБРАНИХ шкіл, щоб вони красиво показувались внизу
    //    (навіть якщо їх нема в поточному search результаті)
    const lastIdsKeyRef = useRef<string>("");

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const ids = safeValue.filter((x) => Number.isFinite(x));
            const key = ids.slice().sort((a, b) => a - b).join(",");
            if (key === lastIdsKeyRef.current) return;
            lastIdsKeyRef.current = key;

            if (ids.length === 0) {
                setSelectedMap(new Map());
                return;
            }

            try {
                const res = await fetchSchools({
                    page: 1,
                    page_size: Math.min(PAGE_SIZE, ids.length),
                    format: "json",
                    // потрібен фільтр на бекенді:
                    // django-filter: id__in
                    id__in: ids.join(","),
                } as any).unwrap();

                if (cancelled) return;

                const m = new Map<number, School>();
                for (const s of (res?.results ?? []) as School[]) {
                    m.set(s.id, s);
                }
                setSelectedMap(m);
            } catch {
                if (cancelled) return;
                setSelectedMap(new Map());
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [safeValue, fetchSchools]);

    const selected = useMemo(() => {
        // зберігаємо порядок як у value
        return safeValue
            .map((id) => selectedMap.get(id))
            .filter(Boolean) as School[];
    }, [safeValue, selectedMap]);

    const toggle = (id: number) => {
        if (disabled) return;

        if (safeValue.includes(id)) {
            onChange(safeValue.filter((x) => x !== id));
            return;
        }

        onChange([...safeValue, id]);
    };

    const remove = (id: number) => {
        if (disabled) return;
        onChange(safeValue.filter((x) => x !== id));
    };

    const loading = isFetching;

    return (
        <div className="space-y-3">
            <Input
                placeholder="Пошук школи..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={disabled}
            />

            <div className="max-h-60 overflow-y-auto rounded-md border bg-background">
                {list.map((s) => {
                    const active = safeValue.includes(s.id);

                    return (
                        <button
                            type="button"
                            key={s.id}
                            onClick={() => toggle(s.id)}
                            className={`grid w-full min-w-0 cursor-pointer gap-2 border-b px-3 py-2.5 text-left last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start ${
                                active ? "bg-primary/5" : "hover:bg-muted/50"
                            } ${disabled ? "pointer-events-none opacity-60" : ""}`}
                        >
                            <div className="min-w-0 space-y-1">
                                <p className="break-words text-sm font-medium leading-tight">
                                    {s.name || "Немає"}
                                </p>

                                <p className="flex min-w-0 items-start gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    <span className="min-w-0 break-words">
                                        {[s.city, s.address].filter(Boolean).join(" · ") || "Адресу не вказано"}
                                    </span>
                                </p>
                            </div>

                            {active ? (
                                <Badge variant="secondary" className="w-fit shrink-0 gap-1">
                                    <Check className="h-3 w-3" />
                                    Обрано
                                </Badge>
                            ) : null}
                        </button>
                    );
                })}

                {!loading && list.length === 0 && (
                    <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        Нічого не знайдено
                    </div>
                )}

                {loading && (
                    <div className="px-4 py-6 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Завантажуємо школи...
                    </div>
                )}
            </div>

            {selected.length > 0 && (
                <div className="grid gap-2">
                    {selected.map((s) => (
                        <div key={s.id} className="min-w-0 rounded-md border bg-muted/20 p-3">
                            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                                <div className="flex min-w-0 items-start gap-2">
                                    <SchoolIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0">
                                        <p className="break-words text-sm font-medium">{s.name || "Немає"}</p>
                                        <p className="mt-1 break-words text-xs text-muted-foreground">
                                            {[s.city, s.address].filter(Boolean).join(" · ") || "Адресу не вказано"}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="w-fit rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:justify-self-end"
                                    onClick={() => remove(s.id)}
                                    aria-label="Видалити школу"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
