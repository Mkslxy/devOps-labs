import React, { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

import type { Question } from "@/store/test-management/test-management.type";
import {
    useAddQuestionsToVersionMutation,
    useRemoveQuestionsFromVersionMutation,
    useGetQuestionsQuery,
} from "@/store/test-management/test-management.api";
import {TYPE_LABELS} from "@/store/test-management/test-management.labels";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    versionId: number | null;
    versionQuestions: Question[];
};

export function VersionQuestionsDialog({
                                           open,
                                           onOpenChange,
                                           versionId,
                                           versionQuestions,
                                       }: Props) {
    const [query, setQuery] = useState("");
    const [selectedAddIds, setSelectedAddIds] = useState<number[]>([]);
    const [selectedRemoveIds, setSelectedRemoveIds] = useState<number[]>([]);
    const [mobileTab, setMobileTab] = useState<"add" | "remove">("add");

    const { data: questionsData, isFetching } = useGetQuestionsQuery({ page: 1 });
    const allQuestions = questionsData?.results ?? [];

    const [addQuestions, { isLoading: isAdding }] = useAddQuestionsToVersionMutation();
    const [removeQuestions, { isLoading: isRemoving }] = useRemoveQuestionsFromVersionMutation();

    const inVersionIds = useMemo(
        () => new Set(versionQuestions.map((q) => q.id)),
        [versionQuestions]
    );

    const availableToAdd = useMemo(() => {
        const q = query.trim().toLowerCase();
        return allQuestions
            .filter((qq) => !inVersionIds.has(qq.id))
            .filter((qq) => (q ? qq.text.toLowerCase().includes(q) : true));
    }, [allQuestions, inVersionIds, query]);

    const availableToRemove = useMemo(() => {
        const q = query.trim().toLowerCase();
        return versionQuestions.filter((qq) => (q ? qq.text.toLowerCase().includes(q) : true));
    }, [versionQuestions, query]);

    useEffect(() => {
        if (!open) {
            setQuery("");
            setSelectedAddIds([]);
            setSelectedRemoveIds([]);
            setMobileTab("add");
        }
    }, [open]);

    const toggle = (arr: number[], id: number) =>
        arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

    const onAdd = async () => {
        if (!versionId) return;
        if (selectedAddIds.length === 0) {
            toast.error("Оберіть питання для додавання");
            return;
        }

        try {
            await addQuestions({ id: versionId, data: { question_ids: selectedAddIds } }).unwrap();
            toast.success("Питання додано");
            setSelectedAddIds([]);
        } catch (e: any) {
            toast.error(e?.data?.detail ?? "Помилка додавання питань");
        }
    };

    const onRemove = async () => {
        if (!versionId) return;
        if (selectedRemoveIds.length === 0) {
            toast.error("Оберіть питання для видалення");
            return;
        }

        try {
            await removeQuestions({ id: versionId, data: { question_ids: selectedRemoveIds } }).unwrap();
            toast.success("Питання видалено");
            setSelectedRemoveIds([]);
        } catch (e: any) {
            toast.error(e?.data?.detail ?? "Помилка видалення питань");
        }
    };

    const disabled = !versionId || isAdding || isRemoving;

    const AddList = (
        <div className="rounded-xl border bg-card">
            <div className="p-3 flex items-center justify-between">
                <div className="text-sm font-medium">Додати у версію</div>
                <Badge variant="secondary" className="rounded-full">
                    {selectedAddIds.length}
                </Badge>
            </div>
            <Separator />
            <div className="p-3 grid gap-2">
                {isFetching ? (
                    <div className="text-sm text-muted-foreground">Завантаження...</div>
                ) : availableToAdd.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Немає питань для додавання.</div>
                ) : (
                    availableToAdd.map((qq) => {
                        const active = selectedAddIds.includes(qq.id);
                        return (
                            <button
                                key={qq.id}
                                type="button"
                                onClick={() => setSelectedAddIds((s) => toggle(s, qq.id))}
                                className={`text-left rounded-lg border px-3 py-2 hover:bg-muted/40 transition cursor-pointer ${
                                    active ? "ring-2 ring-ring" : ""
                                }`}
                            >
                                <div className="text-sm font-medium line-clamp-2">{qq.text}</div>
                                <div className="text-xs text-muted-foreground">
                                    {TYPE_LABELS[qq.type] ?? "Немає"} • {qq.points} б.
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            <div className="px-5 pb-3 pt-0">
                <Button className="w-full cursor-pointer" onClick={onAdd} disabled={disabled || selectedAddIds.length === 0}>
                    Додати
                </Button>
            </div>
        </div>
    );

    const RemoveList = (
        <div className="rounded-xl border bg-card">
            <div className="p-3 flex items-center justify-between">
                <div className="text-sm font-medium">Видалити з версії</div>
                <Badge variant="secondary" className="rounded-full">
                    {selectedRemoveIds.length}
                </Badge>
            </div>
            <Separator />
            <div className="p-3 grid gap-2">
                {availableToRemove.length === 0 ? (
                    <div className="text-sm text-muted-foreground">У версії ще немає питань.</div>
                ) : (
                    availableToRemove.map((qq) => {
                        const active = selectedRemoveIds.includes(qq.id);
                        return (
                            <button
                                key={qq.id}
                                type="button"
                                onClick={() => setSelectedRemoveIds((s) => toggle(s, qq.id))}
                                className={`text-left rounded-lg border px-3 py-2 hover:bg-muted/40 transition cursor-pointer ${
                                    active ? "ring-2 ring-ring" : ""
                                }`}
                            >
                                <div className="text-sm font-medium line-clamp-2">{qq.text}</div>
                                <div className="text-xs text-muted-foreground">
                                    {qq.type} • {qq.points} б.
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            <div className="px-5 pb-3 pt-0">
                <Button
                    variant="destructive"
                    className="w-full cursor-pointer"
                    onClick={onRemove}
                    disabled={disabled || selectedRemoveIds.length === 0}
                >
                    Видалити
                </Button>
            </div>
        </div>
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl p-0">
                <div className="p-4">
                    <SheetHeader>
                        <SheetTitle>Керування питаннями</SheetTitle>
                    </SheetHeader>

                    <div className="mt-3">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Пошук по тексту питання..."
                        />
                    </div>

                    <div className="mt-3">
                        <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as any)}>
                            <TabsList className="w-full grid grid-cols-2">
                                <TabsTrigger value="add">
                                    Додати
                                    <Badge variant="secondary" className="ml-2 rounded-full">
                                        {selectedAddIds.length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="remove">
                                    Видалити
                                    <Badge variant="secondary" className="ml-2 rounded-full">
                                        {selectedRemoveIds.length}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>

                            <div className="mt-3 pb-24">
                                <TabsContent value="add" className="m-0">
                                    <ScrollArea className="h-[62vh] pr-1">{AddList}</ScrollArea>
                                </TabsContent>

                                <TabsContent value="remove" className="m-0">
                                    <ScrollArea className="h-[62vh] pr-1">{RemoveList}</ScrollArea>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
                    <Button className="w-full cursor-pointer" variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding || isRemoving}>
                        Закрити
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
