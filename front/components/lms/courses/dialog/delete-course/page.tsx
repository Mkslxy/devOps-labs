"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {useDeleteCourseMutation} from "@/store/groups/group.api";

interface Props {
    id: number;
    title: string;
}

export function DeleteCourseDialog({ id, title }: Props) {
    const [open, setOpen] = useState(false);
    const [deleteCourse, { isLoading }] = useDeleteCourseMutation();

    const confirm = async () => {
        await deleteCourse(id).unwrap();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button  onClick={(e) => e.stopPropagation()} className="cursor-pointer w-[80px] 2xl:w-[100px]" variant="destructive">Видалити</Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Підтвердження</DialogTitle>
                </DialogHeader>

                <p className="text-sm text-muted-foreground">
                    Ви впевнені, що хочете видалити курс{" "}
                    <span className="font-medium text-foreground">{title}</span>?
                </p>

                <div className="flex justify-end gap-2 mt-4">
                    <Button className="cursor-pointer" variant="outline" onClick={() => setOpen(false)}>
                        Скасувати
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={confirm}
                        disabled={isLoading}
                        className="cursor-pointer"
                    >
                        {isLoading ? "Видалення..." : "Видалити"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
