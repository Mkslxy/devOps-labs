"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteMaterialMutation } from "@/store/material/material.api";
import { useState } from "react";

interface Props {
    id: number;
    title?: string;
}

export function DeleteMaterialDialog({ id, title }: Props) {
    const [open, setOpen] = useState(false);
    const [deleteMaterial, { isLoading }] = useDeleteMaterialMutation();

    const confirm = async () => {
        await deleteMaterial(id).unwrap();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer w-[80px] 2xl:w-[100px]"
                    variant="destructive"
                >
                    Видалити
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Підтвердження</DialogTitle>
                </DialogHeader>

                <p className="text-sm text-muted-foreground">
                    Ви впевнені, що хочете видалити матеріал{" "}
                    <span className="font-medium text-foreground">{title || `#${id}`}</span>?
                </p>

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" className="cursor-pointer" onClick={() => setOpen(false)}>
                        Скасувати
                    </Button>
                    <Button variant="destructive" className="cursor-pointer" onClick={confirm} disabled={isLoading}>
                        {isLoading ? "Видалення..." : "Видалити"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
