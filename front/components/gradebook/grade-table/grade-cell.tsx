import React from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { GradeBookAttendanceCategory } from "@/store/gradebook/gradebook.type";

type PopoverMode = "attendance" | "edit" | "comment";

export function GradeCell({
                              editable,
                              isOpen,
                              onClose,

                              displayValue,
                              cellClassName,

                              hasComment,

                              onOpenAttendance,
                              onOpenComment,

                              popoverMode,

                              editAttendanceCategory,
                              editLateMinutes,
                              onSetAttendanceCategory,
                              onSetLateMinutes,
                              onSaveAttendance,

                              editValue,
                              editComment,
                              onSetValue,
                              onSetComment,
                              onSaveGrade,
                          }: {
    editable: boolean;
    isOpen: boolean;
    onClose: () => void;

    displayValue: React.ReactNode;
    cellClassName: string;

    hasComment: boolean;

    onOpenAttendance: () => void;
    onOpenComment: () => void;

    popoverMode: PopoverMode;

    editAttendanceCategory: GradeBookAttendanceCategory | "";
    editLateMinutes: string;
    onSetAttendanceCategory: (v: GradeBookAttendanceCategory | "") => void;
    onSetLateMinutes: (v: string) => void;
    onSaveAttendance: () => void;

    editValue: string;
    editComment: string;
    onSetValue: (v: string) => void;
    onSetComment: (v: string) => void;
    onSaveGrade: () => void;
}) {
    return (
        <td className="border-b border-border px-1 text-center h-full">
            <Popover
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open) onClose();
                }}
            >
                <PopoverTrigger asChild>
                    <div
                        className={cellClassName}
                        onClick={(e) => {
                            const target = e.target as HTMLElement;
                            const clickedCommentBtn = !!target.closest("[data-comment-btn]");

                            if (clickedCommentBtn) {
                                if (hasComment) onOpenComment();
                                return;
                            }

                            if (!editable) {
                                if (hasComment) onOpenComment();
                                return;
                            }

                            onOpenAttendance();
                        }}
                    >
                        {displayValue}

                        {hasComment && (
                            <button
                                type="button"
                                data-comment-btn
                                className="absolute top-0 right-0 cursor-pointer"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onOpenComment();
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" className="fill-foreground">
                                    <polygon points="12,0 12,12 0,0" />
                                </svg>
                            </button>
                        )}
                    </div>
                </PopoverTrigger>

                <PopoverContent
                    className="w-72 sm:w-80"
                    align="end"
                    side="bottom"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    {popoverMode === "comment" ? (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Коментар викладача</p>
                            <p className="text-sm text-foreground">{editComment || "Немає"}</p>

                            <div className="flex justify-end pt-1">
                                <Button size="sm" variant="outline" className="cursor-pointer" onClick={onClose}>
                                    Закрити
                                </Button>
                            </div>
                        </div>
                    ) : popoverMode === "attendance" ? (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-foreground">Відвідування</p>

                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={editAttendanceCategory === GradeBookAttendanceCategory.present ? "default" : "outline"}
                                    onClick={() => onSetAttendanceCategory(GradeBookAttendanceCategory.present)}
                                >
                                    п
                                </Button>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant={editAttendanceCategory === GradeBookAttendanceCategory.late ? "default" : "outline"}
                                    onClick={() => onSetAttendanceCategory(GradeBookAttendanceCategory.late)}
                                >
                                    о
                                </Button>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant={editAttendanceCategory === GradeBookAttendanceCategory.absent ? "default" : "outline"}
                                    onClick={() => onSetAttendanceCategory(GradeBookAttendanceCategory.absent)}
                                >
                                    н
                                </Button>
                            </div>

                            {editAttendanceCategory === GradeBookAttendanceCategory.late && (
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Хвилин запізнення</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Наприклад: 10"
                                        value={editLateMinutes}
                                        onChange={(e) => onSetLateMinutes(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") onSaveAttendance();
                                            if (e.key === "Escape") onClose();
                                        }}
                                    />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1 cursor-pointer" onClick={onSaveAttendance}>
                                    Зберегти
                                </Button>
                                <Button size="sm" variant="outline" className="cursor-pointer" onClick={onClose}>
                                    Скасувати
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Після <span className="font-medium text-foreground">п</span> відкриється оцінка та коментар.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-foreground">Оцінка та коментар</p>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Оцінка (1-10)</label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="10"
                                    placeholder="Введи оцінку"
                                    value={editValue}
                                    onChange={(e) => onSetValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") onSaveGrade();
                                        if (e.key === "Escape") onClose();
                                    }}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Коментар</label>
                                <Textarea
                                    placeholder="Додай коментар (необов'язково)"
                                    value={editComment}
                                    onChange={(e) => onSetComment(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={onSaveGrade} className="flex-1 gap-2" size="sm">
                                    <Check className="h-4 w-4" />
                                    Зберегти
                                </Button>
                                <Button variant="outline" size="sm" onClick={onClose} className="gap-2">
                                    <X className="h-4 w-4" />
                                    Скасувати
                                </Button>
                            </div>
                        </div>
                    )}
                </PopoverContent>
            </Popover>
        </td>
    );
}
