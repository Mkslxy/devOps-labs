import React from "react";
import { cn } from "@/libs/utils";

import type { UserFormData } from "@/store/users/user.type";
import type { GradebookGridGradeItem } from "@/store/gradebook/gradebook.type";
import { GradeBookAttendanceCategory, type GradeBookAttendance } from "@/store/gradebook/gradebook.type";

import { GradeCell } from "./grade-cell";

type Column = { id: number };

type PopoverMode = "attendance" | "edit" | "comment";

export function GradeRow({
                             student,
                             index,
                             columns,
                             editable,

                             getLatestGrade,
                             getLatestAttendance,
                             getEffectiveAttendanceCategory,

                             isCellOpen,
                             onCloseCell,
                             onOpenCellAttendance,
                             onOpenCellComment,

                             popoverMode,

                             editAttendanceCategory,
                             editLateMinutes,
                             setEditAttendanceCategory,
                             setEditLateMinutes,
                             onSaveAttendance,

                             editValue,
                             editComment,
                             setEditValue,
                             setEditComment,
                             onSaveGrade,

                             calculateAverage,
                             getGradeColor,
                             setPopoverMode,
                         }: {
    student: UserFormData;
    index: number;
    columns: Column[];
    editable: boolean;

    getLatestGrade: (sid: number, colId: number) => GradebookGridGradeItem | null;
    getLatestAttendance: (sid: number, colId: number) => GradeBookAttendance | null;
    getEffectiveAttendanceCategory: (sid: number, colId: number) => GradeBookAttendanceCategory | null;

    isCellOpen: (sid: number, colId: number) => boolean;
    onCloseCell: () => void;

    onOpenCellAttendance: (sid: number, colId: number) => void;
    onOpenCellComment: (sid: number, colId: number) => void;

    popoverMode: PopoverMode;

    editAttendanceCategory: GradeBookAttendanceCategory | "";
    editLateMinutes: string;
    setEditAttendanceCategory: (v: GradeBookAttendanceCategory | "") => void;
    setEditLateMinutes: (v: string) => void;
    onSaveAttendance: () => void;

    editValue: string;
    editComment: string;
    setEditValue: (v: string) => void;
    setEditComment: (v: string) => void;
    onSaveGrade: () => void;

    calculateAverage: (sid: number) => string;
    getGradeColor: (v: number | null) => string;

    setPopoverMode: (m: PopoverMode) => void;
}) {
    const sid = student.id;

    const rowClass = cn(
        "transition-colors hover:bg-muted/30",
        index % 2 === 0 ? "bg-card" : "bg-card/50"
    );

    if (!sid) {
        return (
            <tr className={rowClass}>
                <td
                    className="border-b border-border px-4 py-3 text-center text-sm text-muted-foreground"
                    colSpan={columns.length ? columns.length + 1 : 1}
                >
                    Немає
                </td>
            </tr>
        );
    }

    return (
        <tr className={cn(rowClass, "h-12 sm:h-14")}>
            {columns.map((col) => {
                const grade = getLatestGrade(sid, col.id);
                const hasComment = !!grade?.comment;
                const cat = getEffectiveAttendanceCategory(sid, col.id);

                const cellClassName = cn(
                    "relative mx-auto flex h-8 w-10 items-center justify-center rounded-md text-xs font-medium transition-colors sm:h-9 sm:w-12 sm:text-sm",
                    getGradeColor(cat === GradeBookAttendanceCategory.absent ? null : (grade?.value ?? null)),
                    (grade?.value === null || grade?.value === undefined) && "text-muted-foreground/50",
                    (editable || hasComment) && "cursor-pointer hover:bg-muted/50"
                );

                const displayValue = (() => {
                    if (cat === GradeBookAttendanceCategory.absent) return "н";

                    if (grade?.value !== null && grade?.value !== undefined) return grade.value;

                    if (cat === GradeBookAttendanceCategory.present || cat === GradeBookAttendanceCategory.late) return "-";

                    return "-";
                })();

                return (
                    <GradeCell
                        key={col.id}
                        editable={editable}
                        isOpen={isCellOpen(sid, col.id)}
                        onClose={onCloseCell}
                        displayValue={displayValue}
                        cellClassName={cellClassName}
                        hasComment={hasComment}
                        onOpenComment={() => {
                            setPopoverMode("comment");
                            onOpenCellComment(sid, col.id);
                        }}
                        onOpenAttendance={() => {
                            setPopoverMode("attendance");
                            onOpenCellAttendance(sid, col.id);
                        }}
                        popoverMode={popoverMode}
                        editAttendanceCategory={editAttendanceCategory}
                        editLateMinutes={editLateMinutes}
                        onSetAttendanceCategory={setEditAttendanceCategory}
                        onSetLateMinutes={setEditLateMinutes}
                        onSaveAttendance={onSaveAttendance}
                        editValue={editValue}
                        editComment={editComment}
                        onSetValue={setEditValue}
                        onSetComment={setEditComment}
                        onSaveGrade={onSaveGrade}
                    />
                );
            })}

            <td className="border-b border-l border-border px-3 py-2 text-center">
        <span
            className={cn(
                "rounded-md px-2 py-1 text-sm font-semibold",
                getGradeColor(Number.parseFloat(calculateAverage(sid)) || null)
            )}
        >
          {calculateAverage(sid)}
        </span>
            </td>
        </tr>
    );
}
