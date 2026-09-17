"use client";

import React, {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useRef,
    useState,
    useMemo,
} from "react";
import { toast } from "sonner";
import { useCalendar } from "./calendar-context";
import { DndConfirmationDialog } from "../dialogs/dnd-confirmation-dialog";
import { IEvent } from "../interfaces";
import {useUpdateLessonMutation} from "@/store/lessons/lesson.api";
import { useGetProfileMeQuery } from "@/store/users/user.api";
import { useUpdateStaffMeetingMutation } from "@/store/staff-meeting/staff-meeting.api";
import { useUpdateTrainingMutation } from "@/store/training/training.api";
import {isBefore, startOfDay} from "date-fns";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import { StaffMeetingTypeEnum } from "@/store/staff-meeting/staff-meeting.type";

interface PendingDropData {
    event: IEvent;
    newStartDate: Date;
    newEndDate: Date;
}

interface DragDropContextType {
    draggedEvent: IEvent | null;
    isDragging: boolean;
    startDrag: (event: IEvent) => void;
    readOnly: boolean;
    endDrag: () => void;
    handleEventDrop: (date: Date, hour?: number, minute?: number) => void;
    showConfirmation: boolean;
    setShowConfirmation: (show: boolean) => void;
    pendingDropData: PendingDropData | null;
    handleConfirmDrop: () => void;
    handleCancelDrop: () => void;
    isEventMoving: (id: string) => boolean;
}

interface DndProviderProps {
    children: ReactNode;
    showConfirmation: boolean;
    readOnly?: boolean;
}

function isLessonEvent(e: IEvent) {
    return !e.rawStaffMeeting && !e.rawTraining;
}

function isTrainingEvent(e: IEvent) {
    return Boolean(e.rawTraining) || e.rawStaffMeeting?.type === StaffMeetingTypeEnum.training;
}

function isStaffMeetingEvent(e: IEvent) {
    return Boolean(e.rawStaffMeeting) && !isTrainingEvent(e);
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export function DndProvider({
                                children,
                                showConfirmation: showConfirmationProp = false,
                                readOnly = false,
                            }: DndProviderProps) {

    const { updateEvent } = useCalendar();

    const { data: me } = useGetProfileMeQuery();
    const roleSlug = me?.role?.slug ?? null;

    const isTeacher = roleSlug === "teacher";
    const isMethodist = roleSlug === "methodist";

    const canDnD = !readOnly && (isTeacher || isMethodist);

    const [dragState, setDragState] = useState<{
        draggedEvent: IEvent | null;
        isDragging: boolean;
    }>({ draggedEvent: null, isDragging: false });

    const [movingEventIds, setMovingEventIds] = React.useState<Record<string, true>>({});

    const markMoving = (id: string, v: boolean) => {
        setMovingEventIds(prev => {
            const next = { ...prev };
            if (v) next[id] = true;
            else delete next[id];
            return next;
        });
    };

    const isEventMoving = React.useCallback(
        (id: string) => Boolean(movingEventIds[id]),
        [movingEventIds]
    );

    const [blockedOpen, setBlockedOpen] = useState(false);
    const [blockedMessage, setBlockedMessage] = useState("");

    const [updateLesson] = useUpdateLessonMutation();
    const [updateStaffMeeting] = useUpdateStaffMeetingMutation();
    const [updateTraining] = useUpdateTrainingMutation();

    const [showConfirmation, setShowConfirmation] =
        useState<boolean>(showConfirmationProp);

    const [pendingDropData, setPendingDropData] =
        useState<PendingDropData | null>(null);

    const onEventDroppedRef = useRef<
        ((event: IEvent, newStartDate: Date, newEndDate: Date) => void) | null
    >(null);

    const startDrag = useCallback(
        (event: IEvent) => {
            if (readOnly) return;
            setDragState({ draggedEvent: event, isDragging: true });
        },
        [readOnly]
    );

    const endDrag = useCallback(() => {
        setDragState({ draggedEvent: null, isDragging: false });
    }, []);

    const calculateNewDates = useCallback(
        (event: IEvent, targetDate: Date, hour?: number, minute?: number) => {
            const originalStart = new Date(event.startDate);
            const originalEnd = new Date(event.endDate);
            const duration = originalEnd.getTime() - originalStart.getTime();

            const newStart = new Date(targetDate);
            if (hour !== undefined) {
                newStart.setHours(hour, minute || 0, 0, 0);
            } else {
                newStart.setHours(
                    originalStart.getHours(),
                    originalStart.getMinutes(),
                    0,
                    0
                );
            }

            return {
                newStart,
                newEnd: new Date(newStart.getTime() + duration),
            };
        },
        []
    );

    const isSamePosition = useCallback((d1: Date, d2: Date) => {
        return d1.getTime() === d2.getTime();
    }, []);

    const handleEventDrop = useCallback(
        (targetDate: Date, hour?: number, minute?: number) => {
            if (readOnly) return;
            const { draggedEvent } = dragState;
            if (!draggedEvent) return;

            const today = startOfDay(new Date());
            const dropDay = startOfDay(targetDate);

            if (isBefore(dropDay, today)) {
                setBlockedMessage(
                    "Неможливо перенести подію на минулу дату (заднім числом)."
                );
                setBlockedOpen(true);
                endDrag();
                return;
            }
            const { newStart, newEnd } = calculateNewDates(
                draggedEvent,
                targetDate,
                hour,
                minute
            );
            const originalStart = new Date(draggedEvent.startDate);

            if (isSamePosition(originalStart, newStart)) {
                endDrag();
                return;
            }

            if (showConfirmation) {
                setPendingDropData({
                    event: draggedEvent,
                    newStartDate: newStart,
                    newEndDate: newEnd,
                });
            } else {
                const cb = onEventDroppedRef.current;
                cb?.(draggedEvent, newStart, newEnd);
                endDrag();
            }
        },
        [readOnly, dragState, calculateNewDates, isSamePosition, endDrag, showConfirmation]
    );

    const handleConfirmDrop = useCallback(() => {
        if (readOnly) return;
        if (!pendingDropData) return;

        const cb = onEventDroppedRef.current;
        cb?.(pendingDropData.event, pendingDropData.newStartDate, pendingDropData.newEndDate);

        setPendingDropData(null);
        endDrag();
    }, [pendingDropData, endDrag]);

    const handleCancelDrop = useCallback(() => {
        setPendingDropData(null);
        endDrag();
    }, [endDrag]);

    const handleEventUpdate = useCallback(
        async (event: IEvent, newStartDate: Date, newEndDate: Date) => {
            if (!canDnD) return;

            const id = String(event.id);

            const prevSnapshot = {
                ...event,
                startDate: event.startDate,
                endDate: event.endDate,
            };

            markMoving(id, true);

            updateEvent({
                ...event,
                startDate: newStartDate.toISOString(),
                endDate: newEndDate.toISOString(),
            });

            try {
                if (isLessonEvent(event)) {
                    await updateLesson({
                        id: Number(event.id),
                        data: { start_time: newStartDate.toISOString() },
                    }).unwrap();

                    toast.success("Подію переміщено");
                    return;
                }

                if (isTrainingEvent(event)) {
                    await updateTraining({
                        id: Number(event.id),
                        data: {
                            start_time: newStartDate.toISOString(),
                            end_time: newEndDate.toISOString(),
                        },
                    }).unwrap();

                    toast.success("Тренінг переміщено");
                    return;
                }

                if (isStaffMeetingEvent(event)) {
                    await updateStaffMeeting({
                        id: Number(event.id),
                        data: {
                            start_time: newStartDate.toISOString(),
                            end_time: newEndDate.toISOString(),
                        },
                    }).unwrap();

                    toast.success("Зустріч переміщено");
                    return;
                }

                toast.error("Невідомий тип події");
                updateEvent(prevSnapshot);
            } catch (e) {
                updateEvent(prevSnapshot);
                toast.error("Не вдалося перемістити подію");
            } finally {
                markMoving(id, false);
            }

        },
        [canDnD, readOnly, updateEvent, updateLesson, updateStaffMeeting, updateTraining]
    );

    React.useEffect(() => {
        onEventDroppedRef.current = handleEventUpdate;
    }, [handleEventUpdate]);

    React.useEffect(() => {
        setShowConfirmation(showConfirmationProp);
    }, [showConfirmationProp]);

    const contextValue = useMemo(
        () => ({
            draggedEvent: dragState.draggedEvent,
            isDragging: dragState.isDragging,
            readOnly,
            startDrag,
            endDrag,
            handleEventDrop,
            showConfirmation,
            pendingDropData,
            handleConfirmDrop,
            handleCancelDrop,
            setShowConfirmation,
            isEventMoving
        }),
        [
            dragState.draggedEvent,
            dragState.isDragging,
            readOnly,
            startDrag,
            endDrag,
            handleEventDrop,
            showConfirmation,
            pendingDropData,
            handleConfirmDrop,
            handleCancelDrop,
            isEventMoving
        ]
    );

    return (
        <DragDropContext.Provider value={contextValue}>
            {showConfirmation && pendingDropData && <DndConfirmationDialog />}
            <Dialog open={blockedOpen} onOpenChange={setBlockedOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Дія недоступна</DialogTitle>
                    </DialogHeader>

                    <p className="text-sm text-muted-foreground">{blockedMessage}</p>

                    <DialogFooter>
                        <Button onClick={() => setBlockedOpen(false)}>Зрозуміло</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {children}
        </DragDropContext.Provider>
    );
}

export function useDragDrop() {
    const context = useContext(DragDropContext);
    if (!context) throw new Error("useDragDrop must be used within a DndProvider");
    return context;
}
