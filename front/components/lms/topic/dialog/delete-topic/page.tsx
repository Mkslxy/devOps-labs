"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { useDeleteTopicMutation } from "@/store/topic/topic.api";

export function DeleteTopicDialog({ id, title }: { id: number; title: string }) {
    const [open, setOpen] = useState(false);
    const [deleteTopic, { isLoading }] = useDeleteTopicMutation();

    const confirm = async () => {
        await deleteTopic(id).unwrap();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer w-[90px] 2xl:w-[100px]"
                    variant="destructive"
                >
                    Видалити
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Підтвердження</DialogTitle>
                </DialogHeader>

                <p className="text-sm text-muted-foreground">
                    Ви впевнені, що хочете видалити тему{" "}
                    <span className="font-medium text-foreground">{title}</span>?
                </p>

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Скасувати
                    </Button>
                    <Button variant="destructive" onClick={confirm} disabled={isLoading}>
                        {isLoading ? "Видалення..." : "Видалити"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}