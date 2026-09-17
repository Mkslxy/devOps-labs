import * as React from "react";
import { toast } from "sonner";

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

import { Textarea } from "@/components/ui/textarea";

type Props = {
    children: React.ReactNode;
    onCancel: (reason: string) => Promise<void> | void;
    loading?: boolean;
    title?: string;
    description?: string;
    defaultReason?: string;
};

export function CancelLessonDialog({
                                       children,
                                       onCancel,
                                       loading,
                                       title = "Скасувати урок?",
                                       description = "Будь ласка, вкажіть причину скасування. Цю дію неможливо автоматично відмінити.",
                                       defaultReason = "",
                                   }: Props) {
    const [open, setOpen] = React.useState(false);
    const [reason, setReason] = React.useState(defaultReason);

    React.useEffect(() => {
        if (open) setReason(defaultReason);
    }, [open, defaultReason]);

    const handleCancel = async () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            toast.error("Причина є обовʼязковою.");
            return;
        }

        try {
            await onCancel(trimmed);
            toast.success("Урок скасовано.");
            setOpen(false);
        } catch {
            toast.error("Не вдалося скасувати урок.");
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2">
                    <p className="text-sm font-medium">Причина</p>
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Наприклад: Захворів(ла), форс-мажор, перенесення за домовленістю…"
                        className="min-h-[96px]"
                        disabled={loading}
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer" disabled={loading}>Закрити</AlertDialogCancel>
                    <AlertDialogAction className="cursor-pointer" onClick={handleCancel} disabled={loading}>
                        {loading ? "Скасовую..." : "Так, скасувати"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
