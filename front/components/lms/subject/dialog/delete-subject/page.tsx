"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";

import { Subject } from "@/store/subject/subject.type";
import { useDeleteSubjectMutation } from "@/store/subject/subject.api";

interface DeleteSubjectFormProps {
    subject: Subject;
    onSuccess?: () => void;
}

export default function DeleteSubjectForm({
                                              subject,
                                              onSuccess,
                                          }: DeleteSubjectFormProps) {
    const [errorText, setErrorText] = useState("");

    const [deleteSubject, { isLoading }] = useDeleteSubjectMutation();

    const handleDelete = async () => {
        try {
            setErrorText("");

            await deleteSubject(subject.id).unwrap();

            onSuccess?.();
        } catch (error) {
            const apiError = error as {
                data?: { detail?: string; message?: string } | string;
            };

            setErrorText(
                typeof apiError.data === "string"
                    ? apiError.data
                    : apiError.data?.detail ||
                    apiError.data?.message ||
                    (apiError.data ? JSON.stringify(apiError.data, null, 2) : null) ||
                    "Не вдалося видалити предмет"
            );
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2 text-sm">
                <p>
                    Ви точно хочете видалити предмет{" "}
                    <span className="font-semibold">{subject.name || "Немає"}</span>?
                </p>

                <p className="text-muted-foreground">
                    Якщо предмет використовується в курсах, бекенд може заборонити
                    видалення.
                </p>
            </div>

            {errorText && (
                <pre className="max-h-[180px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-destructive p-3 text-xs text-destructive">
                    {errorText}
                </pre>
            )}

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="destructive"
                    disabled={isLoading}
                    onClick={handleDelete}
                    className="cursor-pointer"
                >
                    {isLoading ? "Видалення..." : "Видалити"}
                </Button>
            </div>
        </div>
    );
}