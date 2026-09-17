import React from "react";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useDeleteQuestionMutation } from "@/store/test-management/test-management.api";

type Props = {
    questionId: number | null;
    open: boolean;
    onClose: () => void;
};

export function DeleteQuestionDialog({ questionId, open, onClose }: Props) {
    const [deleteQuestion, { isLoading }] = useDeleteQuestionMutation();

    const handleDelete = async () => {
        if (!questionId) return;

        try {
            await deleteQuestion(questionId).unwrap();
            toast.success("Питання видалено");
            onClose();
        } catch (e: any) {
            toast.error(e?.data?.detail ?? "Не вдалося видалити питання");
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Видалити питання?</DialogTitle>
                    <DialogDescription>
                        Цю дію неможливо скасувати. Питання буде видалено назавжди.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="cursor-pointer"
                    >
                        Скасувати
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="cursor-pointer"
                    >
                        Видалити
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
