import React from "react";
import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/libs/utils";

type Column = { id: number; title?: string | null; date?: string | null };

export function ColumnsHeaderRow({
                                     columns,
                                     editable,
                                     editingColumnId,
                                     colDraftTitle,
                                     colDraftDate,
                                     onOpenColumn,
                                     onCloseColumn,
                                     onChangeTitle,
                                     onChangeDate,
                                     onSaveColumn,
                                     isSavingColumn,
                                 }: {
    columns: Column[];
    editable: boolean;

    editingColumnId: number | null;
    colDraftTitle: string;
    colDraftDate: string;

    onOpenColumn: (col: Column) => void;
    onCloseColumn: () => void;

    onChangeTitle: (v: string) => void;
    onChangeDate: (v: string) => void;

    onSaveColumn: () => void;
    isSavingColumn: boolean;
}) {
    return (
        <thead>
        <tr className="bg-muted/50 h-12 sm:h-12">
            {columns.length === 0 ? (
                <th className="min-w-[260px] border-b border-border px-4 py-3 text-center text-sm text-muted-foreground">
                    {editable ? (
                        <span className="flex items-center justify-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Додайте колонку для оцінок
                        </span>
                    ) : (
                        "Немає"
                    )}
                </th>
            ) : (
                columns.map((col) => (
                    <th key={col.id} className="min-w-[72px] border-b border-border px-2 text-center">
                        <Popover
                            open={editingColumnId === col.id}
                            onOpenChange={(open) => {
                                if (!editable) return;
                                if (!open) onCloseColumn();
                                else onOpenColumn(col);
                            }}
                        >
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    disabled={!editable}
                                    className={cn("w-full", editable ? "cursor-pointer" : "cursor-default")}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!editable) return;
                                        onOpenColumn(col);
                                    }}
                                >
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <span className="text-xs font-medium hidden sm:flex text-foreground">{col.title || "Немає"}</span>
                                        <span className="rounded px-1.5 py-0.5 sm:py-0 text-[10px] w-[75px] font-medium bg-muted text-muted-foreground">
                                            {col.date || "Немає"}
                                        </span>
                                    </div>
                                </button>
                            </PopoverTrigger>

                            <PopoverContent
                                className="w-72"
                                align="center"
                                side="bottom"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                                <div className="space-y-3 text-left">
                                    <p className="text-sm font-medium text-foreground">Редагувати колонку</p>

                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground">Назва</label>
                                        <Input
                                            value={colDraftTitle}
                                            onChange={(e) => onChangeTitle(e.target.value)}
                                            placeholder="Немає"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") onSaveColumn();
                                                if (e.key === "Escape") onCloseColumn();
                                            }}
                                            autoFocus
                                            disabled={isSavingColumn}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground">Дата</label>
                                        <Input
                                            value={colDraftDate}
                                            onChange={(e) => onChangeDate(e.target.value)}
                                            placeholder="2026-02-04"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") onSaveColumn();
                                                if (e.key === "Escape") onCloseColumn();
                                            }}
                                            disabled={isSavingColumn}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button size="sm" className="flex-1 cursor-pointer" onClick={onSaveColumn} disabled={isSavingColumn}>
                                            Зберегти
                                        </Button>
                                        <Button size="sm" variant="outline" className="cursor-pointer" onClick={onCloseColumn} disabled={isSavingColumn}>
                                            Скасувати
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </th>
                ))
            )}

            {columns.length > 0 && (
                <th className="min-w-[72px] border-b border-l border-border px-3 py-3 text-center text-sm font-medium text-foreground">
                    Сер.
                </th>
            )}
        </tr>
        </thead>
    );
}
