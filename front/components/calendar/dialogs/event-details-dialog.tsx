"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Link as LinkIcon, Text, User } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCalendar } from "../contexts/calendar-context";
import { formatTime, toCapitalize } from "../helpers";
import { AddEditEventDialog } from "./add-edit-event-dialog";
import { uk } from "date-fns/locale";
import { CancelLessonDialog } from "@/components/calendar/dialogs/delete-event-dialog";
import { DeleteEventDialog } from "@/components/calendar/dialogs/delete-event-methodist-dialog";
import { useCancelLessonByTeacherMutation } from "@/store/lessons/lesson.api";
import { useDeleteStaffMeetingMutation } from "@/store/staff-meeting/staff-meeting.api";
import { useDeleteTrainingMutation } from "@/store/training/training.api";
import { useGetProfileMeQuery } from "@/store/users/user.api";
import { STAFF_MEETING_TYPE_LABELS } from "@/store/staff-meeting/staff-meeting.label";
import { StaffMeetingTypeEnum } from "@/store/staff-meeting/staff-meeting.type";
import {ReplaceTeacherDialog} from "@/components/calendar/dialogs/replace-teacher-dialog";
import {LessonPlanStatusEnum} from "@/store/lessons/lesson.type"
import {ReviewLessonPlanDialog} from "@/components/calendar/dialogs/review-lesson-plan-dialog"
import {IEvent, IStaffMeetingEvent} from "@/components/calendar/interfaces";

function getStaffRaw(e?: IEvent): IStaffMeetingEvent | null {
    return e?.rawStaffMeeting ?? null;
}

export function EventDetailsDialog({
                                       event,
                                       children,
                                       canEditCalendar,
                                   }: {
    event: IEvent;
    children: ReactNode;
    canEditCalendar?: boolean;
}) {
    const staff = getStaffRaw(event);
    const training = event.rawTraining ?? null;

    const isTraining = Boolean(training);
    const isStaff = Boolean(staff) || isTraining;

    const startISO = staff?.start_time ?? training?.start_time ?? event.startDate;
    const endISO = staff?.end_time ?? training?.end_time ?? event.endDate;

    const startDate = parseISO(startISO);
    const endDate = parseISO(endISO);

    const isCancelled = !isStaff && event.status === "cancelled_by_teacher";

    const { use24HourFormat } = useCalendar();

    const { data: me } = useGetProfileMeQuery(undefined);
    const roleSlug = me?.role?.slug ?? "";

    const isMethodist = roleSlug === "methodist";
    const isMethodistLessonOnly = isMethodist && !isStaff;

    const canSeeActions = Boolean(canEditCalendar);
    const canManageStaffMeeting = isMethodist;

    const canEditButton =
        !isMethodistLessonOnly &&
        (!isStaff ? canSeeActions : canManageStaffMeeting);

    const canDeleteOrCancelButton =
        !isMethodistLessonOnly &&
        (!isStaff ? canSeeActions : canManageStaffMeeting);

    const lesson = event.rawLesson ?? null;
    const planStatus = lesson?.plan_status ?? LessonPlanStatusEnum.empty;

    const canReviewLessonPlan =
        isMethodistLessonOnly &&
        !isCancelled &&
        planStatus === LessonPlanStatusEnum.on_review;

    const isPlanApproved =
        isMethodistLessonOnly &&
        !isCancelled &&
        planStatus === LessonPlanStatusEnum.approved;

    const isPlanChangesRequested =
        isMethodistLessonOnly &&
        !isCancelled &&
        planStatus === LessonPlanStatusEnum.changes_requested;

    const [cancelLesson, { isLoading: isCancelLoading }] = useCancelLessonByTeacherMutation();
    const [deleteStaffMeeting, { isLoading: isDeleteLoading }] = useDeleteStaffMeetingMutation();
    const [deleteTraining, { isLoading: isDeleteTrainingLoading }] = useDeleteTrainingMutation();

    const isStudent = !canEditCalendar;

    const showReplaceTeacherButton = isMethodistLessonOnly && !isCancelled;

    const lessonPlan = event.rawLesson?.lesson_plan ?? null;

    const isOnline = Boolean(staff?.is_online ?? training?.is_online ?? event.is_online);
    const meetLink = staff?.meet_link ?? training?.meet_link ?? event.meet_link ?? null;

    const description = staff?.description ?? training?.description ?? event.description ?? null;
    const createdByFullName = staff?.created_by?.full_name ?? training?.created_by?.full_name ?? null;

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent className="pt-5 pb-0 px-4">
                <DialogHeader>
                    <DialogTitle>{event.title}</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[80vh]">
                    <div className="space-y-4 p-4">
                        <div className="flex items-start gap-2">
                            <Calendar className="mt-1 size-4 shrink-0 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Початкова дата</p>
                                <p className="text-sm text-muted-foreground">
                                    {toCapitalize(format(startDate, "EEEE dd MMMM", { locale: uk }))}
                                    <span className="mx-1">о</span>
                                    {formatTime(parseISO(startISO), use24HourFormat)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <Clock className="mt-1 size-4 shrink-0 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Кінцева дата</p>
                                <p className="text-sm text-muted-foreground">
                                    {toCapitalize(format(endDate, "EEEE dd MMMM", { locale: uk }))}
                                    <span className="mx-1">до</span>
                                    {formatTime(parseISO(endISO), use24HourFormat)}
                                </p>
                            </div>
                        </div>

                        {(isStudent || isMethodistLessonOnly) && !isStaff ? (
                            <div className="flex items-start gap-2">
                                <User className="mt-1 size-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Викладач</p>
                                    <p className="text-sm text-muted-foreground">
                                        {event.teacher?.full_name ?? "Немає"}
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {isMethodist && isStaff ? (
                            <div className="flex items-start gap-2">
                                <User className="mt-1 size-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Створив</p>
                                    <p className="text-sm text-muted-foreground">
                                        {createdByFullName ?? "Немає"}
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {isMethodist && staff ? (
                            <div className="flex items-start gap-2">
                                <Text className="mt-1 size-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Тип</p>
                                    <p className="text-sm text-muted-foreground">
                                        {staff.type
                                            ? (STAFF_MEETING_TYPE_LABELS[
                                                staff.type as StaffMeetingTypeEnum
                                                ] ?? "Немає")
                                            : "Немає"}
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {isOnline && meetLink ? (
                            <div className="flex items-start gap-2">
                                <LinkIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Meet</p>
                                    <a
                                        className="text-sm text-primary underline break-all"
                                        href={meetLink}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {meetLink}
                                    </a>
                                </div>
                            </div>
                        ) : null}

                        <div className="flex items-start gap-2">
                            <Text className="mt-1 size-4 shrink-0 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Опис</p>
                                <p className="text-sm text-muted-foreground">
                                    {description ?? "Немає"}
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="flex justify-end gap-2">
                    {isCancelled ? (
                        <Button
                            variant="secondary"
                            className="bg-emerald-600 text-white hover:bg-emerald-600"
                            disabled
                        >
                            Скасовано
                        </Button>
                    ) : null}

                    {!isCancelled && canEditButton ? (
                        <AddEditEventDialog event={event}>
                            <Button variant="outline">Редагувати</Button>
                        </AddEditEventDialog>
                    ) : null}

                    {!isCancelled && canDeleteOrCancelButton ? (
                        isTraining ? (
                            <DeleteEventDialog
                                loading={isDeleteTrainingLoading}
                                onDelete={async () => {
                                    await deleteTraining({ id: event.id }).unwrap();
                                }}
                            >
                                <Button variant="destructive" disabled={isDeleteTrainingLoading}>
                                    Видалити
                                </Button>
                            </DeleteEventDialog>
                        ) : isStaff ? (
                            <DeleteEventDialog
                                loading={isDeleteLoading}
                                onDelete={async () => {
                                    await deleteStaffMeeting(event.id).unwrap();
                                }}
                            >
                                <Button variant="destructive" disabled={isDeleteLoading}>
                                    Видалити
                                </Button>
                            </DeleteEventDialog>
                        ) : (
                            <CancelLessonDialog
                                loading={isCancelLoading}
                                onCancel={async (reason) => {
                                    await cancelLesson({ id: event.id, reason }).unwrap();
                                }}
                            >
                                <Button
                                    className="cursor-pointer"
                                    variant="destructive"
                                    disabled={isCancelLoading}
                                >
                                    Скасувати урок
                                </Button>
                            </CancelLessonDialog>
                        )
                    ) : null}
                    {showReplaceTeacherButton ? (
                        <ReplaceTeacherDialog
                            lessonId={event.id}
                            currentTeacherId={event.teacher?.id ?? null}
                            trigger={<Button variant="outline">Замінити викладача</Button>}
                        />
                    ) : null}

                    {canReviewLessonPlan ? (
                        <ReviewLessonPlanDialog
                            lessonId={event.id}
                            lessonPlan={lessonPlan}
                            trigger={<Button variant="outline">Перевірити план уроку</Button>}
                        />
                    ) : null}

                    {!canReviewLessonPlan && (isPlanApproved || isPlanChangesRequested) ? (
                        <Button variant="secondary" disabled>
                            {isPlanApproved
                                ? "План уроку схвалено"
                                : "Потрібні правки"}
                        </Button>
                    ) : null}
                </div>

                <DialogClose />
            </DialogContent>
        </Dialog>
    );
}
