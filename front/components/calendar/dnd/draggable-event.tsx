import { motion } from "framer-motion";
import type React from "react";
import type { ReactNode } from "react";
import { IEvent } from "../interfaces";
import { useDragDrop } from "../contexts/dnd-context";
import { cn } from "@/libs/utils";

interface DraggableEventProps {
    event: IEvent;
    children: ReactNode;
    className?: string;
}

export function DraggableEvent({ event, children, className }: DraggableEventProps) {
    const { startDrag, endDrag, isDragging, draggedEvent, isEventMoving, readOnly } = useDragDrop();

    const moving = isEventMoving?.(String(event.id));
    const isCurrentlyDragged = isDragging && draggedEvent?.id === event.id;

    const disabled = readOnly || moving;

    return (
        <div
            className={cn(
                className,
                disabled
                    ? "opacity-60 cursor-default"
                    : isCurrentlyDragged
                        ? "opacity-50 cursor-grabbing"
                        : "cursor-grab"
            )}
            draggable={!disabled}
            onDragStart={disabled ? undefined : (e: React.DragEvent<HTMLDivElement>) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.dropEffect = "move";
                e.dataTransfer.setData("text/plain", String(event.id));
                startDrag(event);
            }}
            onDragEnd={disabled ? undefined : () => {
                endDrag();
            }}
            onClick={(e) => e.stopPropagation()}
            aria-disabled={disabled}
        >
            <motion.div>{children}</motion.div>
        </div>
    );
}
