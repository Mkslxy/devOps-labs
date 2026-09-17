import React from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

type Props = {
    title: string;
    description?: string;
    actionLabel?: string;
    actionIcon?: React.ReactNode;
    onAction?: () => void;
    actionVariant?: React.ComponentProps<typeof Button>["variant"];
    actionDisabled?: boolean;
    children: React.ReactNode;

    onEdit?: () => void;
    onDelete?: () => void;
    editDisabled?: boolean;
    deleteDisabled?: boolean;
};

export function HeaderSection({
                                 title,
                                 description,
                                 actionLabel,
                                 actionIcon,
                                 onAction,
                                 actionVariant = "outline",
                                 actionDisabled,
                                 children,

                                  onEdit,
                                 onDelete,
                                 editDisabled,
                                 deleteDisabled,
                             }: Props) {
    return (
        <div className="rounded-xl border bg-background">
            <div className="p-4 flex justify-between flex-col md:flex-row gap-3">
                <div className="min-w-0 text-left">
                    <div className="text-sm font-medium">{title}</div>
                    {description && (
                        <div className="text-xs text-muted-foreground">{description}</div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row lg:flex-col 2xl:flex-row gap-2">
                    {onEdit && (
                        <Button size="sm" className="2xl:w-[90px]" variant="outline" onClick={onEdit} disabled={editDisabled}>
                            Редагувати
                        </Button>
                    )}

                    {onDelete && (
                        <Button size="sm" variant="destructive" className="2xl:w-[90px]" onClick={onDelete} disabled={deleteDisabled}>
                            Видалити
                        </Button>
                    )}

                    {actionLabel && (
                        <Button
                            size="sm"
                            variant={actionVariant}
                            onClick={onAction}
                            disabled={actionDisabled}
                        >
                            {actionIcon}
                            {actionLabel}
                        </Button>
                    )}
                </div>
            </div>

            <Separator />
            {children}
        </div>
    );
}
