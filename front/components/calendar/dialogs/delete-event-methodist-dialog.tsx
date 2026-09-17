import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {ReactNode} from "react";

interface DeleteEventDialogProps {
    children: ReactNode;
    loading?: boolean;
    onDelete: () => Promise<void> | void;
}

export function DeleteEventDialog({ children, loading, onDelete }: DeleteEventDialogProps) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Видалити подію?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Подію буде видалено без можливості відновлення.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Скасувати</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={loading}
                        onClick={async () => {
                            await onDelete();
                        }}
                    >
                        Видалити
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
