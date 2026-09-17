import React, { type ReactNode } from "react";
import {cn} from "@/libs/utils";
import {useDragDrop} from "@/components/calendar/contexts/dnd-context";

interface DroppableAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    date: Date;
    hour?: number;
    minute?: number;
    children: ReactNode;
    classname?: string;

    getDropMeta?: (
        e: React.DragEvent<HTMLDivElement>
    ) => { hour?: number; minute?: number; date?: Date };
}

export function DroppableArea({ date, hour, minute, children, className , getDropMeta, ...rest }: DroppableAreaProps) {
    const { handleEventDrop, isDragging } = useDragDrop();


    return (
        <div
            {...rest}
            className={cn(className, isDragging && "ring-1 ring-primary/20")}
            onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                rest.onDragOver?.(e);
            }}
            onDrop={(e) => {
                e.preventDefault();

                const meta = getDropMeta?.(e);
                const d = meta?.date ?? date;

                handleEventDrop(d, meta?.hour ?? hour, meta?.minute ?? minute);

                rest.onDrop?.(e);
            }}
        >
            {children}
        </div>
    );
}

