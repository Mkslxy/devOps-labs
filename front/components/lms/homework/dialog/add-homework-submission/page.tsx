import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Trash2, Save, X, FileText } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
    useCreateHomeWorkSubmissionMutation,
    useUpdateHomeWorkSubmissionMutation,
    useDeleteHomeWorkSubmissionMutation, useGetHomeWorkSubmissionByIdQuery,
} from "@/store/homework/homework.api";

import type {
    Homework,
    HomeWorkSubmission,
} from "@/store/homework/homework.type";
import {skipToken} from "@reduxjs/toolkit/query";

type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;

    homework: Homework | null;
    existingSubmission?: HomeWorkSubmission | null;
    isLocked?: boolean;
};

export function SubmissionDialog({ open, onOpenChange, homework, existingSubmission }: Props) {
    const [createSubmission, createState] = useCreateHomeWorkSubmissionMutation();
    const [updateSubmission, updateState] = useUpdateHomeWorkSubmissionMutation();
    const [deleteSubmission, deleteState] = useDeleteHomeWorkSubmissionMutation();

    const isEditing = Boolean(existingSubmission?.id);
    const submissionId = existingSubmission?.id ?? null;

    const submissionByIdQuery = useGetHomeWorkSubmissionByIdQuery(
        open && submissionId ? submissionId : skipToken
    );
    const submission = (submissionByIdQuery.data ?? existingSubmission ?? null) as HomeWorkSubmission | null;


    const [text, setText] = useState<string>("");
    const [localFiles, setLocalFiles] = useState<File[]>([]);
    const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);

    const inputRef = useRef<HTMLInputElement | null>(null);

    const isMutating = createState.isLoading || updateState.isLoading || deleteState.isLoading;

    useEffect(() => {
        if (!open) return;

        setText(existingSubmission?.submission_text ?? "");
        setLocalFiles([]);
        setDeletedFileIds([]);
    }, [open, existingSubmission]);

    const canSubmit = useMemo(() => Boolean(homework?.id) && !isMutating, [homework?.id, isMutating]);

    const onPickFiles = () => {
        if (isMutating) return;
        inputRef.current?.click();
    };



    const onFilesSelected = (files: FileList | null) => {
        const next = Array.from(files ?? []);
        if (!next.length) return;

        setLocalFiles((prev) => {
            const map = new Map<string, File>();
            for (const f of prev) map.set(`${f.name}-${f.size}`, f);
            for (const f of next) map.set(`${f.name}-${f.size}`, f);
            return Array.from(map.values());
        });

        if (inputRef.current) inputRef.current.value = "";
    };

    const onRemoveLocalFile = (file: File) => {
        setLocalFiles((prev) => prev.filter((f) => !(f.name === file.name && f.size === file.size)));
    };

    const onMarkServerFileDeleted = (id?: number) => {
        if (typeof id !== "number") return;
        setDeletedFileIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const toSubmissionFormData = (args: {
        homeworkId: number;
        text?: string;
        files?: File[];
        deletedFileIds?: number[];
    }) => {
        const fd = new FormData();

        fd.append("homework_id", String(args.homeworkId));

        if (args.text && args.text.trim()) {
            fd.append("submission_text", args.text.trim());
        }

        for (const f of args.files ?? []) {
            fd.append("uploaded_files", f);
        }

        for (const id of args.deletedFileIds ?? []) {
            fd.append("deleted_file_ids", String(id));
        }

        return fd;
    };

    const onSave = async () => {
        if (!homework?.id) return;

        const fd = toSubmissionFormData({
            homeworkId: homework.id,
            text,
            files: localFiles,
            deletedFileIds: deletedFileIds,
        });

        if (!existingSubmission?.id) {
            await createSubmission(fd).unwrap();
            onOpenChange(false);
            return;
        }

        await updateSubmission({ id: existingSubmission.id, data: fd }).unwrap();
        onOpenChange(false);
    };

    const onRemoveSubmission = async () => {
        if (!existingSubmission?.id) return;
        await deleteSubmission(existingSubmission.id).unwrap();
        onOpenChange(false);
    };

    const serverFiles = useMemo(() => {
        const raw =
            (submission as any)?.files ??
            (submission as any)?.attachments ??
            (submission as any)?.uploaded_files ??
            [];

        return Array.isArray(raw) ? raw : [];
    }, [submission]);

    useEffect(() => {
        if (!open) return;

        setText((submission as any)?.submission_text ?? "");
        setLocalFiles([]);
        setDeletedFileIds([]);
    }, [open, submissionId]);

    const title = isEditing ? "Редагувати здачу" : "Здати роботу";

    return (
        <Dialog open={open} onOpenChange={(v) => !isMutating && onOpenChange(v)}>
            <DialogContent className="sm:max-w-[720px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {title}
                        {isEditing ? <Badge variant="secondary">Є здача</Badge> : <Badge>Нова</Badge>}
                    </DialogTitle>
                    <DialogDescription>{homework?.title ?? "Немає"}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Коментар / відповідь</div>
                        <Textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Напишіть відповідь або короткий коментар…"
                            rows={6}
                            disabled={isMutating}
                        />
                        <div className="text-xs text-muted-foreground">
                            Можна залишити порожнім, якщо здаєш тільки файлом.
                        </div>
                    </div>

                    <div className="rounded-xl border p-4 space-y-3">
                        <div className="flex flex-col md:flex-row justify-between gap-3">
                            <div className="space-y-0.5">
                                <div className="text-sm font-medium">Файли</div>
                                <div className="text-xs text-muted-foreground">
                                    Додай файли до здачі.
                                </div>
                            </div>

                            <input
                                ref={inputRef}
                                type="file"
                                className="hidden"
                                multiple
                                onChange={(e) => onFilesSelected(e.target.files)}
                                disabled={isMutating}
                            />

                            <Button
                                type="button"
                                variant="outline"
                                className="bg-transparent cursor-pointer"
                                onClick={onPickFiles}
                                disabled={isMutating}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Додати файл
                            </Button>
                        </div>

                        {serverFiles.length ? (
                            <div className="space-y-2">
                                <div className="text-xs text-muted-foreground">Вже прикріплено:</div>
                                <div className="flex flex-wrap gap-2">
                                    {serverFiles.map((f: any) => {
                                        const id = f?.id as number | undefined;
                                        const name = f?.name ?? f?.file_name ?? "Файл";
                                        const isMarked = typeof id === "number" ? deletedFileIds.includes(id) : false;

                                        return (
                                            <Badge
                                                key={id ?? f?.url ?? `${name}-${Math.random()}`}
                                                variant={isMarked ? "destructive" : "secondary"}
                                                className="gap-2"
                                            >
                                                <FileText className="w-3 h-3" />
                                                <span className="max-w-[240px] truncate">{name}</span>

                                                {typeof id === "number" ? (
                                                    <button
                                                        type="button"
                                                        className="ml-1 inline-flex items-center rounded-full hover:opacity-80"
                                                        onClick={() => onMarkServerFileDeleted(id)}
                                                        disabled={isMutating}
                                                        title={isMarked ? "Позначено на видалення" : "Позначити на видалення"}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                ) : null}
                                            </Badge>
                                        );
                                    })}
                                </div>

                                {deletedFileIds.length ? (
                                    <div className="text-xs text-muted-foreground">
                                        Позначено на видалення: <span className="font-medium">{deletedFileIds.length}</span>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">Немає прикріплених файлів</div>
                        )}

                        {localFiles.length ? (
                            <div className="space-y-2">
                                <div className="text-xs text-muted-foreground">Обрано до завантаження:</div>
                                <div className="space-y-2">
                                    {localFiles.map((f) => (
                                        <div
                                            key={`${f.name}-${f.size}`}
                                            className="flex items-center justify-between rounded-lg border px-3 py-2"
                                        >
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium truncate">{f.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {Math.round(f.size / 1024)} КБ
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="justify-between"
                                                onClick={() => onRemoveLocalFile(f)}
                                                disabled={isMutating}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {(createState.error || updateState.error || deleteState.error) ? (
                        <div className="text-sm text-destructive">Сталася помилка. Спробуйте ще раз.</div>
                    ) : null}
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="bg-transparent cursor-pointer"
                        onClick={() => onOpenChange(false)}
                        disabled={isMutating}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Скасувати
                    </Button>

                    {isEditing ? (
                        <Button type="button" variant="destructive" className="cursor-pointer" onClick={onRemoveSubmission} disabled={isMutating}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Видалити
                        </Button>
                    ) : null}

                    <Button type="button" className="cursor-pointer" onClick={onSave} disabled={!canSubmit}>
                        <Save className="w-4 h-4 mr-2" />
                        Зберегти
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
