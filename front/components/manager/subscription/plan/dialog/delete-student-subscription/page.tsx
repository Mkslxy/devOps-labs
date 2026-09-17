"use client";

import React, { ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { useDeleteStudentSubscriptionMutation } from "@/store/subscription/student-subscription.api";

interface DeleteStudentSubscriptionDialogProps {
    id: number;
    studentName?: string;
    planName?: string;
    trigger: ReactNode;
    onSuccess?: () => void;
}

export function DeleteStudentSubscriptionDialog({
                                                    id,
                                                    studentName,
                                                    planName,
                                                    trigger,
                                                    onSuccess,
                                                }: DeleteStudentSubscriptionDialogProps) {
    const [open, setOpen] = useState(false);
    const [errorText, setErrorText] = useState("");

    const [deleteStudentSubscription, { isLoading }] =
        useDeleteStudentSubscriptionMutation();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Видалити абонемент студента?</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Card className="space-y-2 p-4 text-sm">
                        <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Студент</span>
                            <span className="text-right font-medium">
                                {studentName || "Немає"}
                            </span>
                        </div>

                        <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">План</span>
                            <span className="text-right font-medium">
                                {planName || "Немає"}
                            </span>
                        </div>
                    </Card>

                    <p className="text-sm text-muted-foreground">
                        Цю дію не можна буде скасувати. Абонемент буде видалено зі списку
                        призначених абонементів.
                    </p>

                    {errorText && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {errorText}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Скасувати
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isLoading}
                            onClick={async () => {
                                try {
                                    setErrorText("");

                                    await deleteStudentSubscription(id).unwrap();

                                    setOpen(false);
                                    onSuccess?.();
                                } catch (error) {
                                    setErrorText(JSON.stringify(error, null, 2));
                                }
                            }}
                        >
                            Видалити
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}