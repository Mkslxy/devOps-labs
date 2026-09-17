"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteReportTemplateMutation } from "@/store/reports/report-template.api";

interface DeleteReportTemplateDialogProps {
    id: number;
    name: string;
    trigger: React.ReactNode;
}

export function DeleteReportTemplateDialog({
                                               id,
                                               name,
                                               trigger,
                                           }: DeleteReportTemplateDialogProps) {
    const [open, setOpen] = useState(false);

    const [deleteReportTemplate, { isLoading }] =
        useDeleteReportTemplateMutation();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Видалити шаблон звіту?</DialogTitle>
                </DialogHeader>

                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Ви дійсно хочете видалити шаблон:
                    </p>

                    <p className="font-medium">{name || "Немає"}</p>

                    <p className="text-sm text-muted-foreground">
                        Цю дію неможливо буде скасувати.
                    </p>
                </div>

                <DialogFooter>
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
                            await deleteReportTemplate(id).unwrap();
                            setOpen(false);
                        }}
                    >
                        {isLoading ? "Видалення..." : "Видалити"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}