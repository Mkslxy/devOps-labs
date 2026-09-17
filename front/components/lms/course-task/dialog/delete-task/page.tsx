import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useDeleteTaskMutation } from "@/store/task-default/task-default.api";

export function DeleteTaskDialog({
                                     taskId,
                                     taskTitle,
                                     onClick,
                                 }: {
    taskId: number;
    taskTitle?: string;
    onClick?: (e: any) => void;
}) {
    const [del, state] = useDeleteTaskMutation();

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    className="cursor-pointer"
                    size="sm"
                    variant="destructive"
                    onClick={onClick}
                    disabled={state.isLoading}
                >
                    Видалити
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Видалити завдання?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {`Завдання: ${taskTitle?.trim() ? taskTitle : "Немає"}. Дію неможливо скасувати.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={state.isLoading}>Скасувати</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={state.isLoading}
                        onClick={async () => {
                            await del({ id: taskId }).unwrap();
                        }}
                    >
                        Підтвердити
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
