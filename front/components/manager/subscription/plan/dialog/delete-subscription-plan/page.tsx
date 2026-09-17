"use client";

import React, { ReactNode, useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useDeleteSubscriptionPlanMutation } from "@/store/subscription/subscription-plan.api";

interface Props {
    id: number;
    name?: string;
    trigger?: ReactNode;
}

export function DeleteSubscriptionPlanDialog({ id, name, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [errorText, setErrorText] = useState("");

    const [deleteSubscriptionPlan, { isLoading }] =
        useDeleteSubscriptionPlanMutation();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button variant="destructive">Видалити</Button>
                )}
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Видалити абонемент</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {errorText ? (
                        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                            {errorText}
                        </div>
                    ) : null}

                    <div className="rounded-2xl border bg-muted/30 p-4">
                        <p className="text-sm text-muted-foreground">
                            Ви дійсно хочете видалити абонемент?
                        </p>

                        <p className="mt-2 break-words font-medium">
                            {name ? name : "Немає"}
                        </p>
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                                setErrorText("");

                                try {
                                    await deleteSubscriptionPlan(id).unwrap();
                                    setOpen(false);
                                } catch (error: any) {
                                    const message =
                                        error?.data?.detail ||
                                        error?.data?.message ||
                                        (typeof error?.data === "string"
                                            ? error.data
                                            : null) ||
                                        "Не вдалося видалити абонемент";

                                    setErrorText(message);
                                }
                            }}
                        >
                            {isLoading ? "Видалення..." : "Видалити"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}