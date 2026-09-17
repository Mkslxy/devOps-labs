import React from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
    open: boolean;
    assignmentId?: number | null;

    loading?: boolean;

    onClose: () => void;
    onConfirm: (id: number) => Promise<any> | void;
};

export function DeleteAssignmentDialog({
                                           open,
                                           assignmentId,
                                           loading,
                                           onClose,
                                           onConfirm,
                                       }: Props) {
    const handleConfirm = async () => {
        if (!assignmentId) return;
        await onConfirm(assignmentId);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Видалити призначення?</DialogTitle>
                    <DialogDescription>
                        Ви дійсно хочете видалити призначення{" "}
                        {assignmentId ? (
                            <span className="font-medium">#{assignmentId}</span>
                        ) : null}
                        ?
                        <br />
                        Цю дію неможливо скасувати.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="cursor-pointer"
                    >
                        Скасувати
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!assignmentId || loading}
                        className="cursor-pointer"
                    >
                        {loading ? "Видалення..." : "Видалити"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
