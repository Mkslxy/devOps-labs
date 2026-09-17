import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

import { useGetTeachersQuery, useGetMethodistQuery, useGetManagerQuery, useGetFinancierQuery } from "@/store/users/user.api";

type Person = {
    id: number;
    full_name?: string | null;
    email?: string | null;
    role?: { slug?: string | null } | null;
};

function normalizePeople(list: any): Person[] {
    if (!list?.results) return [];
    return list.results
        .filter((u: any) => u?.id)
        .map((u: any) => ({
            id: u.id,
            full_name: u.full_name ?? u.name ?? null,
            email: u.email ?? null,
            role: u.role ?? null,
        }));
}

export function AttendeesPicker({
                                    value,
                                    onChange,
                                    triggerText = "Обрати запрошених",
                                    onlyTeachers = false,
                                }: {
    value: number[];
    onChange: (ids: number[]) => void;
    triggerText?: string;
    onlyTeachers?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");

    const teachers = useGetTeachersQuery({ page: 1, page_size: 100, search: q });

    const methodists = useGetMethodistQuery(
        { page: 1, page_size: 100, search: q },
        { skip: onlyTeachers }
    );

    const managers = useGetManagerQuery(
        { page: 1, page_size: 100, search: q },
        { skip: onlyTeachers }
    );

    const financiers = useGetFinancierQuery(
        { page: 1, page_size: 100, search: q },
        { skip: onlyTeachers }
    );

    const people = useMemo(() => {
        const all = onlyTeachers
            ? [...normalizePeople(teachers.data)]
            : [
                ...normalizePeople(teachers.data),
                ...normalizePeople(methodists.data),
                ...normalizePeople(managers.data),
                ...normalizePeople(financiers.data),
            ];

        const map = new Map<number, Person>();
        for (const p of all) map.set(p.id, p);

        return Array.from(map.values()).sort((a, b) => {
            const an = (a.full_name ?? "").toLowerCase();
            const bn = (b.full_name ?? "").toLowerCase();
            return an.localeCompare(bn);
        });
    }, [onlyTeachers, teachers.data, methodists.data, managers.data, financiers.data]);

    const peopleById = useMemo(() => {
        const m = new Map<number, Person>();
        for (const p of people) m.set(p.id, p);
        return m;
    }, [people]);

    const selectedResolved = useMemo(() => {
        return (value ?? []).map((id) => peopleById.get(id) ?? ({ id } as Person));
    }, [value, peopleById]);

    const toggle = (id: number) => {
        const set = new Set(value);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        onChange(Array.from(set.values()));
    };

    const remove = (id: number) => {
        onChange(value.filter((x) => x !== id));
    };

    const isLoading = onlyTeachers
        ? teachers.isLoading
        : teachers.isLoading || methodists.isLoading || managers.isLoading || financiers.isLoading;

    return (
        <div className="grid gap-2">
            {value.length ? (
                <div className="flex flex-wrap gap-2">
                    {selectedResolved.map((p) => (
                        <Badge key={p.id} variant="secondary" className="flex items-center gap-2">
                            <span className="max-w-[220px] truncate">
                                {p.full_name ?? p.email ?? `ID ${p.id}`}
                            </span>
                            <button
                                type="button"
                                className="text-xs opacity-70 hover:opacity-100"
                                onClick={() => remove(p.id)}
                            >
                                ✕
                            </button>
                        </Badge>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-muted-foreground">Немає</div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="outline">
                        {triggerText}
                    </Button>
                </DialogTrigger>

                <DialogContent className="max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle>Запрошені</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-3">
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук за ім’ям або email" />

                        <div className="max-h-[360px] overflow-auto rounded-xl border p-2">
                            {isLoading ? (
                                <div className="p-3 text-sm text-muted-foreground">Завантаження...</div>
                            ) : people.length ? (
                                <div className="grid gap-2">
                                    {people.map((p) => {
                                        const checked = value.includes(p.id);
                                        return (
                                            <Card key={p.id} className="p-3">
                                                <div className="flex items-start gap-3">
                                                    <Checkbox checked={checked} onCheckedChange={() => toggle(p.id)} />
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium">
                                                            {p.full_name ?? p.email ?? `ID ${p.id}`}
                                                        </div>
                                                        <div className="truncate text-xs text-muted-foreground">
                                                            {p.email ?? "Немає"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-3 text-sm text-muted-foreground">Немає</div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Закрити
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}