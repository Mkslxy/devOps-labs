import React, { useMemo, useState } from "react";
import { Upload, Trash2, FileText } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import type { Task, TaskSubmission, TaskSubmissionPayload } from "@/store/task-default/task-default.type";

type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;

    task: Task | null;
    existingSubmission: TaskSubmission | null;

    isLocked?: boolean;
    isMutating?: boolean;

    onCreate: (payload: TaskSubmissionPayload) => Promise<void>;
    onUpdate: (id: number, payload: TaskSubmissionPayload) => Promise<void>;
};

function pickTaskTitle(task: Task | null) {
    if (!task) return "Немає";
    return (task as any)?.title ?? (task as any)?.name ?? "Немає";
}

function pickExistingFiles(sub: TaskSubmission | null) {
    const raw = (sub as any)?.files ?? (sub as any)?.attachments ?? [];
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
}

export function TaskSubmissionDialog({
                                         open,
                                         onOpenChange,
                                         task,
                                         existingSubmission,
                                         isLocked,
                                         isMutating,
                                         onCreate,
                                         onUpdate,
                                     }: Props) {
    const taskId = (task as any)?.id ?? null;

    const [text, setText] = useState<string>("");
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [deletedIds, setDeletedIds] = useState<number[]>([]);

    const existingFiles = useMemo(() => pickExistingFiles(existingSubmission), [existingSubmission]);

    React.useEffect(() => {
        if (!open) return;

        const v = (existingSubmission as any)?.submission_text ?? (existingSubmission as any)?.text ?? "";
        setText(String(v ?? ""));

        setUploadedFiles([]);
        setDeletedIds([]);
    }, [open, existingSubmission]);

    const disabled = Boolean(isLocked) || Boolean(isMutating) || !taskId;

    return (
        <Dialog open={open} onOpenChange={(v) => onOpenChange(v)}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Здача роботи</DialogTitle>
                    <DialogDescription>
                        {task ? `Завдання: ${pickTaskTitle(task)}` : "Немає"}
                    </DialogDescription>
                </DialogHeader>

                {isLocked ? (
                    <div className="text-sm text-muted-foreground">
                        Дедлайн минув — редагування/здача недоступні.
                    </div>
                ) : null}

                <div className="space-y-4">
                    <Card>
                        <CardContent className="pt-4 space-y-3">
                            <div className="text-sm font-medium">Текст здачі</div>
                            <Textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Опишіть, що ви зробили, або додайте пояснення"
                                disabled={disabled}
                            />
                            <div className="text-xs text-muted-foreground">
                                Якщо текст не потрібен — можна залишити порожнім.
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-medium">Файли</div>
                                <Badge variant="secondary">{existingFiles.length + uploadedFiles.length}</Badge>
                            </div>

                            {existingFiles.length === 0 && uploadedFiles.length === 0 ? (
                                <div className="text-sm text-muted-foreground">Немає</div>
                            ) : (
                                <div className="space-y-2">
                                    {existingFiles.map((f: any, idx: number) => {
                                        const id = f?.id ?? f?.pk ?? f?.file_id ?? null;
                                        const url = f?.url ?? f?.file ?? f?.download_url ?? "";
                                        const name = f?.name ?? f?.filename ?? `Файл #${idx + 1}`;
                                        const markedDeleted = typeof id === "number" ? deletedIds.includes(id) : false;

                                        return (
                                            <div key={`existing-${id ?? idx}`} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                                                <div className="min-w-0 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium truncate">{name || "Немає"}</div>
                                                        <div className="text-xs text-muted-foreground truncate">{url || "Немає"}</div>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="bg-transparent"
                                                    disabled={disabled || !id}
                                                    onClick={() => {
                                                        if (typeof id !== "number") return;
                                                        setDeletedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    {markedDeleted ? "Повернути" : "Видалити"}
                                                </Button>
                                            </div>
                                        );
                                    })}

                                    {uploadedFiles.map((f, idx) => (
                                        <div key={`new-${idx}-${f.name}`} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                                            <div className="min-w-0 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium truncate">{f.name || "Немає"}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{`${Math.max(1, Math.round(f.size / 1024))} KB`}</div>
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="bg-transparent"
                                                disabled={disabled}
                                                onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Прибрати
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="bg-transparent w-full sm:w-auto cursor-pointer"
                                    disabled={disabled}
                                    onClick={() => {
                                        const input = document.createElement("input");
                                        input.type = "file";
                                        input.multiple = true;
                                        input.onchange = () => {
                                            const files = input.files ? Array.from(input.files) : [];
                                            if (files.length === 0) return;
                                            setUploadedFiles((prev) => [...prev, ...files]);
                                        };
                                        input.click();
                                    }}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Додати файли
                                </Button>

                                <div className="text-xs text-muted-foreground flex items-center">
                                    Додавайте кілька файлів за потреби.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => onOpenChange(false)}
                        disabled={Boolean(isMutating)}
                    >
                        Скасувати
                    </Button>

                    <Button
                        className="cursor-pointer"
                        disabled={disabled}
                        onClick={async () => {
                            if (!taskId) return;

                            const payload: TaskSubmissionPayload = {
                                task_id: Number(taskId),
                                submission_text: text?.trim() ? text.trim() : undefined,
                                uploaded_files: uploadedFiles.length ? uploadedFiles : undefined,
                                deleted_files_ids: deletedIds.length ? deletedIds : undefined,
                            };

                            if (existingSubmission?.id) {
                                await onUpdate(existingSubmission.id, payload);
                            } else {
                                await onCreate(payload);
                            }

                            onOpenChange(false);
                        }}
                    >
                        {existingSubmission?.id ? "Зберегти" : "Здати"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}