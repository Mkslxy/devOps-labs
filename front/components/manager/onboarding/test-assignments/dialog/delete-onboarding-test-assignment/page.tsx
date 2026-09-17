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
import { useDeleteOnboardingTestAssignmentMutation } from "@/store/onboarding/onboarding-test-assignment.api";

interface Props {
    id: number;
    name?: string;
    trigger: ReactNode;
}

export function DeleteOnboardingTestAssignmentDialog({ id, name, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [deleteAssignment, { isLoading }] = useDeleteOnboardingTestAssignmentMutation();

    const handleDelete = async () => {
        await deleteAssignment(id).unwrap();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Видалити призначення тесту?</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Ви дійсно хочете видалити призначення тесту{" "}
                        <span className="font-medium text-foreground">
                            {name || "Немає"}
                        </span>
                        ? Цю дію неможливо скасувати.
                    </p>

                    <div className="flex justify-end gap-3">
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
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            {isLoading ? "Видалення..." : "Видалити"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}