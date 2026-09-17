import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    versionId?: number | null;
    loading?: boolean;
    onConfirm: () => void | Promise<void>;
};

export function DeleteTestVersionDialog({
                                            open,
                                            onOpenChange,
                                            versionId,
                                            loading,
                                            onConfirm,
                                        }: Props) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Видалити версію?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {versionId ? `Версія #${versionId} буде видалена без можливості відновлення.` : "Оберіть версію."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={!!loading}>Скасувати</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={!!loading || !versionId}>
                        Видалити
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
