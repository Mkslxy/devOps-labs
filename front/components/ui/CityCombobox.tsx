import React, {useEffect, useMemo, useRef, useState} from "react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";

export function normalizeCity(s: string) {
    return (s || "").trim();
}

export function includesLoose(hay: string, needle: string) {
    return hay.toLowerCase().includes(needle.toLowerCase());
}

export function CityCombobox({
                          label = "Місто *",
                          placeholder = "Почніть вводити місто...",
                          value,
                          onChange,
                          options,
                          required,
                      }: {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    options: readonly string[];
    required?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value);
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    const suggestions = useMemo(() => {
        const q = normalizeCity(query);
        if (!q) return options.slice(0, 8);
        return options.filter((c) => includesLoose(c, q)).slice(0, 8);
    }, [options, query]);

    const hasExact = useMemo(() => {
        const q = normalizeCity(query);
        if (!q) return false;
        return options.some((c) => c.toLowerCase() === q.toLowerCase());
    }, [options, query]);

    const commit = (v: string) => {
        const next = normalizeCity(v);
        onChange(next);
        setQuery(next);
        setOpen(false);
    };

    return (
        <div
            ref={rootRef}
            className="space-y-2"
            onBlur={(e) => {
                const nextTarget = e.relatedTarget as Node | null;
                if (!nextTarget || !rootRef.current?.contains(nextTarget)) {
                    commit(query);
                }
            }}
        >
            <Label htmlFor="city">{label}</Label>

            <div className="relative">
                <Input
                    id="city"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    required={required}
                    className="h-11"
                    autoComplete="off"
                />

                {open ? (
                    <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-background shadow-md">
                        <div className="max-h-64 overflow-auto p-1">
                            {suggestions.length ? (
                                <>
                                    {suggestions.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                            }}
                                            onClick={() => commit(c)}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">Немає</div>
                            )}

                            {!hasExact && normalizeCity(query) ? (
                                <>
                                    <div className="my-1 h-px bg-border" />
                                    <button
                                        type="button"
                                        className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => commit(query)}
                                        title="Використати введене значення"
                                    >
                                        Використати: <span className="font-medium">{normalizeCity(query)}</span>
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}