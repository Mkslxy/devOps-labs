"use client";

import { ReactNode, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteGroupMutation } from "@/store/groups/group.api";

export function DeleteGroupDialog({
                                      id,
                                      name,
                                      trigger,
                                  }: {
    id: number;
    name: string;
    trigger?: ReactNode;
}) {
    const [deleteGroup, { isLoading }] = useDeleteGroupMutation();
    const [open, setOpen] = useState(false);

    const handleDelete = async () => {
        await deleteGroup(id).unwrap();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer"
                        variant="destructive"
                    >
                        Видалити
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Видалити групу?</DialogTitle>
                </DialogHeader>

                <p className="text-sm text-muted-foreground">
                    Група{" "}
                    <span className="font-medium text-foreground">
                        {name || "Немає"}
                    </span>{" "}
                    буде видалена без можливості відновлення.
                </p>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Скасувати
                    </Button>

                    <Button
                        variant="destructive"
                        disabled={isLoading}
                        onClick={handleDelete}
                    >
                        {isLoading ? "Видалення..." : "Видалити"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}