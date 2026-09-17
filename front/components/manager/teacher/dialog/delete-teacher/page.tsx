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
import { useDeleteTeacherMutation } from "@/store/users/user.api";

interface Props {
    id: number;
    full_name: string;
    trigger?: ReactNode;
}

export function DeleteTeacherDialog({ id, full_name, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [deleteTeacher, { isLoading }] = useDeleteTeacherMutation();

    const confirm = async () => {
        await deleteTeacher(id).unwrap();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer w-[90px] 2xl:w-[100px]"
                        variant="destructive"
                    >
                        Видалити
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Підтвердження</DialogTitle>
                </DialogHeader>

                <p className="text-sm text-muted-foreground">
                    Ви впевнені, що хочете видалити викладача{" "}
                    <span className="font-medium text-foreground">
                        {full_name || "Немає"}
                    </span>
                    ?
                </p>

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Скасувати
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={confirm}
                        disabled={isLoading}
                    >
                        {isLoading ? "Видалення..." : "Видалити"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}