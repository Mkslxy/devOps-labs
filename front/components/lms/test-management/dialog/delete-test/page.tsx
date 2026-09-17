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
    testTitle?: string;
    disabled?: boolean;
    onConfirm: () => void | Promise<void>;
};

export function DeleteTestDialog({
                                     open,
                                     onOpenChange,
                                     testTitle,
                                     disabled,
                                     onConfirm,
                                 }: Props) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Видалити тест?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {testTitle
                            ? `Тест “${testTitle}” буде видалено без можливості відновлення.`
                            : "Оберіть тест для видалення."}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={!!disabled}>Скасувати</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={!!disabled || !testTitle}>
                        Видалити
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
