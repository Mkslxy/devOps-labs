import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { useDeleteHomeWorkMutation } from "@/store/homework/homework.api";

type Props = {
    homeworkId: number;
    homeworkTitle?: string | null;
    onDeleted?: () => void;
};

export function DeleteHomeworkDialog({
                                         homeworkId,
                                         homeworkTitle,
                                         onDeleted,
                                     }: Props) {
    const [open, setOpen] = React.useState(false);

    const [deleteHomework, { isLoading }] = useDeleteHomeWorkMutation();

    const handleDelete = async () => {
        try {
            await deleteHomework(homeworkId).unwrap();
            toast.success("Домашнє завдання видалено");
            setOpen(false);
            onDeleted?.();
        } catch (e: any) {
            toast.error(e?.data?.detail ?? "Не вдалося видалити");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="cursor-pointer"
                    size="sm"
                    variant="destructive"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Видалити домашнє завдання?</DialogTitle>
                    <DialogDescription>
                        {homeworkTitle
                            ? `Цю дію неможливо скасувати. Буде видалено: "${homeworkTitle}".`
                            : "Цю дію неможливо скасувати."}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <Button
                        className="cursor-pointer"
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                    >
                        Скасувати
                    </Button>

                    <Button
                        className="cursor-pointer"
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? "Видаляю..." : "Видалити"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
