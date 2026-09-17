"use client";

import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { UserFormData } from "@/store/users/user.type";
import {
    CategoryEnum,
    GradeBookAttendance,
    GradeBookAttendanceCategory,
    GradeBookAttendancePayload,
} from "@/store/gradebook/gradebook.type";
import type { GradebookGridGradeItem, GradebookGridCell } from "@/store/gradebook/gradebook.type";

import {
    useGetGradebookGridQuery,
    useCreateGradeBookGradeMutation,
    useUpdateGradeBookGradeMutation,
    useCreateGradeBookColumnMutation,
    useCreateGradeBookAttendanceMutation,
    useUpdateGradeBookAttendanceMutation,
    usePatchGradeBookColumnMutation, useGetGradeBookAttendanceQuery,
} from "@/store/gradebook/gradebook.api";

import type { Group } from "@/store/groups/group.type";

import { StudentColumnTable } from "./grade-table/student-column-table";
import { ColumnsHeaderRow } from "./grade-table/columns-header-row";
import { GradeRow } from "./grade-table/grade-row";

type PopoverMode = "attendance" | "edit" | "comment";

function getGradeColor(value: number | null): string {
    if (value === null) return "";
    if (value >= 9) return "bg-primary/20 text-primary";
    if (value >= 7) return "bg-chart-3/20 text-chart-3";
    if (value >= 5) return "bg-warning/20 text-warning";
    return "bg-destructive/20 text-destructive";
}

interface GradeTableProps {
    group: Group;
    editable?: boolean;
    onBack?: () => void;
}

export function GradeTable({ group, editable = false, onBack }: GradeTableProps) {
    const groupId = group.id;

    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState("");
    const [newColumnDate, setNewColumnDate] = useState("");

    const [createColumn, createColumnState] = useCreateGradeBookColumnMutation();

    const [patchColumn, patchColumnState] = usePatchGradeBookColumnMutation();
    const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
    const [colDraftTitle, setColDraftTitle] = useState("");
    const [colDraftDate, setColDraftDate] = useState("");

    const openColumnEditor = (colId: number, title?: string | null, date?: string | null) => {
        setEditingColumnId(colId);
        setColDraftTitle(title ?? "");
        setColDraftDate(date ?? "");
    };

    const closeColumnEditor = () => {
        setEditingColumnId(null);
        setColDraftTitle("");
        setColDraftDate("");
    };

    const handleSaveColumn = async () => {
        if (!editingColumnId) return;

        await patchColumn({
            id: editingColumnId,
            data: {
                title: colDraftTitle.trim() ? colDraftTitle.trim() : undefined,
                date: colDraftDate.trim() ? colDraftDate.trim() : undefined,
            },
        }).unwrap();

        closeColumnEditor();
    };

    const [editingCell, setEditingCell] = useState<{ studentId: number; columnId: number } | null>(null);
    const [editValue, setEditValue] = useState("");
    const [editComment, setEditComment] = useState("");
    const [editAttendanceCategory, setEditAttendanceCategory] = useState<GradeBookAttendanceCategory | "">("");
    const [editLateMinutes, setEditLateMinutes] = useState("");
    const [popoverMode, setPopoverMode] = useState<PopoverMode>("attendance");

    const closeCellPopover = () => {
        setEditingCell(null);
        setEditValue("");
        setEditComment("");
        setEditAttendanceCategory("");
        setEditLateMinutes("");
    };

    const { data: grid, isLoading: gridLoading } = useGetGradebookGridQuery(
        { group_id: Number(groupId) },
        { skip: !groupId }
    );

    const { data: attendanceResp } = useGetGradeBookAttendanceQuery(
        { group: groupId, page_size: 1000, ordering: "created_at" },
        { skip: !groupId }
    );

    const attendanceByCellKey = useMemo(() => {
        const map: Record<string, GradeBookAttendance> = {};
        const list = attendanceResp?.results ?? [];

        for (const a of list) {
            const key = `${a.student}_${a.column}`;
            map[key] = a;
        }

        return map;
    }, [attendanceResp]);

    const columns = useMemo(() => grid?.columns ?? [], [grid]);
    const students: UserFormData[] = group.students ?? [];
    const category = CategoryEnum.classwork;

    const getCell = (studentId: number, columnId: number): GradebookGridCell | undefined => {
        const key = `${studentId}_${columnId}`;
        return grid?.cells?.[key];
    };

    const cellKey = (studentId: number, columnId: number) => `${studentId}_${columnId}`;

    const getLatestGrade = (studentId: number, columnId: number): GradebookGridGradeItem | null => {
        const cell = getCell(studentId, columnId);
        if (!cell?.grades?.length) return null;
        return cell.grades[cell.grades.length - 1];
    };

    const getLatestAttendance = (studentId: number, columnId: number): GradeBookAttendance | null => {
        const key = cellKey(studentId, columnId);
        return attendanceByCellKey[key] ?? null;
    };

    const getEffectiveAttendanceCategory = (studentId: number, columnId: number): GradeBookAttendanceCategory | null => {
        const a = getLatestAttendance(studentId, columnId);
        return a?.category ?? null;
    };

    const [createGrade] = useCreateGradeBookGradeMutation();
    const [updateGrade] = useUpdateGradeBookGradeMutation();

    const [createAttendance] = useCreateGradeBookAttendanceMutation();
    const [updateAttendance] = useUpdateGradeBookAttendanceMutation();

    const handleAddColumn = async () => {
        if (!groupId) return;
        if (!newColumnTitle.trim()) return;

        await createColumn({
            group: groupId,
            title: newColumnTitle.trim(),
            comment: undefined,
            date: newColumnDate.trim() || undefined,
        }).unwrap();

        setNewColumnTitle("");
        setNewColumnDate("");
        setIsAddingColumn(false);
    };

    const openCellComment = (studentId: number, columnId: number) => {
        const grade = getLatestGrade(studentId, columnId);
        if (!grade?.comment) return;

        setPopoverMode("comment");
        setEditingCell({ studentId, columnId });
        setEditComment(grade.comment);
    };

    const openCellAttendance = (studentId: number, columnId: number) => {
        const attendance = getLatestAttendance(studentId, columnId);
        const grade = getLatestGrade(studentId, columnId);

        setEditingCell({ studentId, columnId });
        setPopoverMode("attendance");

        setEditAttendanceCategory(attendance?.category ?? "");

        setEditLateMinutes(attendance?.late_minutes ? String(attendance.late_minutes) : "");

        setEditValue(grade?.value !== null && grade?.value !== undefined ? String(grade.value) : "");
        setEditComment(grade?.comment ?? "");
    };

    const handleSaveGrade = async () => {
        if (!editingCell) return;

        const value = editValue.trim() === "" ? undefined : Number.parseInt(editValue, 10);
        if (value !== undefined && (!Number.isFinite(value) || value < 1 || value > 10)) {
            closeCellPopover();
            return;
        }

        const existing = getLatestGrade(editingCell.studentId, editingCell.columnId);

        if (existing) {
            await updateGrade({
                id: existing.id,
                data: {
                    category,
                    student: editingCell.studentId,
                    column: editingCell.columnId,
                    value,
                    comment: editComment.trim() ? editComment : undefined,
                    uploaded_files: [],
                    deleted_file_ids: [],
                },
            }).unwrap();
        } else {
            await createGrade({
                category,
                student: editingCell.studentId,
                column: editingCell.columnId,
                value,
                comment: editComment.trim() ? editComment : undefined,
                uploaded_files: [],
                deleted_file_ids: [],
            }).unwrap();
        }

        closeCellPopover();
    };

    const handleSaveAttendance = async () => {
        if (!editingCell) return;
        if (!editAttendanceCategory) {
            closeCellPopover();
            return;
        }

        const lateMinutes =
            editAttendanceCategory === GradeBookAttendanceCategory.late
                ? (() => {
                    const n = Number.parseInt(editLateMinutes || "0", 10);
                    return Number.isFinite(n) && n > 0 ? n : undefined;
                })()
                : undefined;

        const payload: GradeBookAttendancePayload = {
            column: editingCell.columnId,
            student: editingCell.studentId,
            category: editAttendanceCategory,
            late_minutes: lateMinutes,
            comment: undefined,
        };

        const existing = getLatestAttendance(editingCell.studentId, editingCell.columnId);

        if (existing) await updateAttendance({ id: existing.id, data: payload }).unwrap();
        else await createAttendance(payload).unwrap();

        if (editAttendanceCategory === GradeBookAttendanceCategory.absent) {
            closeCellPopover();
            return;
        }

        const grade = getLatestGrade(editingCell.studentId, editingCell.columnId);
        setPopoverMode("edit");
        setEditValue(grade?.value !== null && grade?.value !== undefined ? String(grade.value) : "");
        setEditComment(grade?.comment ?? "");
        setEditLateMinutes("");
    };

    const calculateAverage = (studentId: number): string => {
        const values: number[] = [];

        for (const col of columns) {
            const g = getLatestGrade(studentId, col.id);
            if (g?.value !== null && g?.value !== undefined) values.push(g.value);
        }

        if (!values.length) return "Немає";
        const sum = values.reduce((a, b) => a + b, 0);
        return (sum / values.length).toFixed(1);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground sm:text-xl">{group.name}</h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {editable && (
                        <Popover open={isAddingColumn} onOpenChange={setIsAddingColumn}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 bg-transparent cursor-pointer w-full md:w-auto">
                                    <Plus className="h-4 w-4" />
                                    Додати колонку
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent className="w-72" align="end">
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-foreground">Нова колонка</p>

                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground">Назва</label>
                                        <Input
                                            placeholder="Наприклад: 05.02 / Урок 12"
                                            value={newColumnTitle}
                                            onChange={(e) => setNewColumnTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") void handleAddColumn();
                                                if (e.key === "Escape") setIsAddingColumn(false);
                                            }}
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground">Дата (опційно)</label>
                                        <Input
                                            placeholder="2026-02-04"
                                            value={newColumnDate}
                                            onChange={(e) => setNewColumnDate(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") void handleAddColumn();
                                                if (e.key === "Escape") setIsAddingColumn(false);
                                            }}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => void handleAddColumn()}
                                            className="flex-1"
                                            disabled={createColumnState.isLoading}
                                        >
                                            Додати
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setIsAddingColumn(false)}>
                                            Скасувати
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    {onBack && (
                        <Button variant="outline" className="cursor-pointer w-full md:w-auto" onClick={onBack}>
                            Назад до списку
                        </Button>
                    )}
                </div>
            </div>

            <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex w-full overflow-hidden rounded-lg border border-border">
                    <StudentColumnTable students={students} />

                    <div className="min-w-0 flex-1 overflow-x-auto touch-pan-x overscroll-x-contain">
                        <table className="w-full border-collapse">
                            <ColumnsHeaderRow
                                columns={columns}
                                editable={editable}
                                editingColumnId={editingColumnId}
                                colDraftTitle={colDraftTitle}
                                colDraftDate={colDraftDate}
                                onOpenColumn={(col) => openColumnEditor(col.id, col.title, col.date)}
                                onCloseColumn={closeColumnEditor}
                                onChangeTitle={setColDraftTitle}
                                onChangeDate={setColDraftDate}
                                onSaveColumn={handleSaveColumn}
                                isSavingColumn={patchColumnState.isLoading}
                            />

                            <tbody>
                            {students.map((student, index) => (
                                <GradeRow
                                    key={`row-${student.id ?? index}`}
                                    student={student}
                                    index={index}
                                    columns={columns}
                                    editable={editable}
                                    getLatestGrade={getLatestGrade}
                                    getLatestAttendance={getLatestAttendance}
                                    getEffectiveAttendanceCategory={getEffectiveAttendanceCategory}
                                    isCellOpen={(sid, colId) =>
                                        !!editingCell && editingCell.studentId === sid && editingCell.columnId === colId
                                    }
                                    onCloseCell={closeCellPopover}
                                    onOpenCellAttendance={openCellAttendance}
                                    onOpenCellComment={openCellComment}
                                    popoverMode={popoverMode}
                                    editAttendanceCategory={editAttendanceCategory}
                                    editLateMinutes={editLateMinutes}
                                    setEditAttendanceCategory={setEditAttendanceCategory}
                                    setEditLateMinutes={setEditLateMinutes}
                                    onSaveAttendance={handleSaveAttendance}
                                    editValue={editValue}
                                    editComment={editComment}
                                    setEditValue={setEditValue}
                                    setEditComment={setEditComment}
                                    onSaveGrade={handleSaveGrade}
                                    calculateAverage={calculateAverage}
                                    getGradeColor={getGradeColor}
                                    setPopoverMode={setPopoverMode}
                                />
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {gridLoading && <div className="text-sm text-muted-foreground">Завантаження…</div>}
        </div>
    );
}
