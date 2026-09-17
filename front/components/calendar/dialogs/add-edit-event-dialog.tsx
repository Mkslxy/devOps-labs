"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, set } from "date-fns";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

import {IEvent, IStaffMeetingEvent} from "../interfaces";
import { eventSchema, TEventFormData } from "../schemas";
import { statusLessonsForTeacher } from "../constants";

import { useGetGroupsQuery } from "@/store/groups/group.api";
import { useGoogleColorsQuery } from "@/store/google/google.api";

import {
    useCreateLessonMutation,
    useGetLessonTypesQuery,
    useUpdateLessonMutation,
    useCreateRecurringLessonsMutation, useUpdateLessonPlanMutation,
} from "@/store/lessons/lesson.api";

import {
    useCreateStaffMeetingMutation,
    useUpdateStaffMeetingMutation,
} from "@/store/staff-meeting/staff-meeting.api";

import { useGetProfileMeQuery } from "@/store/users/user.api";
import { LessonTypeManagerDialog } from "@/components/ui/LessonTypeManagerDialog";
import { SchedulePicker } from "@/components/calendar/ui-calendar/SchedulePicker";

import {LessonCategoryEnum, LessonPlanStatusEnum} from "@/store/lessons/lesson.type";

import { StaffMeetingTypeEnum } from "@/store/staff-meeting/staff-meeting.type";
import { STAFF_MEETING_TYPE_LABELS } from "@/store/staff-meeting/staff-meeting.label";

import { AttendeesPicker } from "../attendeesPicker";
import { useForm } from "react-hook-form";
import {useCreateTrainingMutation, useUpdateTrainingMutation} from "@/store/training/training.api";
import {DateTimePickers} from "@/components/calendar/ui-calendar/date-time-picker";

function getStaffRaw(e?: IEvent): IStaffMeetingEvent | null {
    return e?.rawStaffMeeting ?? null;
}

interface IProps {
    children?: ReactNode;
    startDate?: Date;
    startTime?: { hour: number; minute: number };
    event?: IEvent;
    onSaved?: () => void;

    open?: boolean;
    onOpenChange?: (open: boolean) => void;

    initialStart?: Date;
    initialEnd?: Date;
}

export function AddEditEventDialog({
                                       children,
                                       startDate,
                                       startTime,
                                       event,
                                       onSaved,

                                       open,
                                       onOpenChange,

                                       initialStart,
                                       initialEnd,
                                   }: IProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = open ?? internalOpen;
    const setIsOpen = onOpenChange ?? setInternalOpen;

    const isEditing = !!event;

    const { data: me } = useGetProfileMeQuery();
    const roleSlug = me?.role?.slug ?? null;

    const isMethodist = roleSlug === "methodist";
    const isTeacher = roleSlug === "teacher";

    const rawLesson = event?.rawLesson ?? null;

    const planStatus = rawLesson?.plan_status;

    const isPlanSubmitted = planStatus === LessonPlanStatusEnum.on_review || planStatus === LessonPlanStatusEnum.approved;


    const isLessonPlanLocked = isTeacher && rawLesson?.plan_status === LessonPlanStatusEnum.on_review;

    const canUseDialog = isMethodist || isTeacher;

    const teacherId = me?.id;

    const [createLesson, { isLoading: isCreatingLesson }] = useCreateLessonMutation();
    const [updateLesson, { isLoading: isUpdatingLesson }] = useUpdateLessonMutation();
    const [createRecurringLessons, { isLoading: isCreatingRecurringLesson }] =
        useCreateRecurringLessonsMutation();

    const [createTraining, { isLoading: isCreatingTraining }] = useCreateTrainingMutation();
    const [updateTraining, { isLoading: isUpdatingTraining }] = useUpdateTrainingMutation();

    const [createStaffMeeting, { isLoading: isCreatingStaffMeeting }] =
        useCreateStaffMeetingMutation();
    const [updateStaffMeeting, { isLoading: isUpdatingStaffMeeting }] =
        useUpdateStaffMeetingMutation();

    const { data: groupData, error: groupError } = useGetGroupsQuery({
        page: 1,
        page_size: 50,
    });

    const [updateLessonPlan, { isLoading: isUpdatingLessonPlan }] = useUpdateLessonPlanMutation();

    const { data: lessonTypesResp } = useGetLessonTypesQuery();
    const lessonTypes = lessonTypesResp?.results ?? [];
    const [openTypes, setOpenTypes] = useState(false);

    const {
        data: Colors,
        isLoading: isLoadingColors,
        error: colorError,
    } = useGoogleColorsQuery();

    const initialDates = useMemo<{ startDate: Date; endDate: Date }>(() => {
        if (!event) {
            if (!startDate) {
                const now = new Date();
                return { startDate: now, endDate: addMinutes(now, 30) };
            }

            const start = startTime
                ? set(new Date(startDate), {
                    hours: startTime.hour,
                    minutes: startTime.minute,
                    seconds: 0,
                })
                : new Date(startDate);

            return { startDate: start, endDate: addMinutes(start, 30) };
        }

        const staff = getStaffRaw(event);
        const startIso = staff ? staff.start_time : event.startDate;
        const endIso = staff ? staff.end_time : event.endDate;

        return {
            startDate: new Date(startIso),
            endDate: new Date(endIso),
        };
    }, [event, startDate, startTime]);

    const defaultValues = useMemo<TEventFormData>(() => {
        const staffEvent = getStaffRaw(event);
        const lessonEvent = staffEvent ? null : event;
        const trainingEvent = event?.rawTraining ?? null;

        const methodistEvent = staffEvent ?? trainingEvent;

        const existingAttendees: number[] = methodistEvent
            ? Array.isArray(methodistEvent.attendee_ids) && methodistEvent.attendee_ids.length > 0
                ? methodistEvent.attendee_ids.filter((x): x is number => true)
                : Array.isArray(methodistEvent.attendees)
                    ? methodistEvent.attendees
                        .map((a: { id?: unknown } | null | undefined) => a?.id)
                        .filter((x): x is number => typeof x === "number")
                    : []
            : [];

        if (isMethodist) {
            return {
                kind: "methodist",
                mode: "methodist",
                isRecurring: false,

                title: methodistEvent?.title ?? event?.title ?? "",
                description: methodistEvent?.description ?? event?.description ?? "",

                startDate: initialDates.startDate,
                endDate: initialDates.endDate,

                color: methodistEvent ? Number(methodistEvent.color_id) : 1,
                isOnline: Boolean(methodistEvent?.is_online),

                category: (staffEvent?.type ??
                    trainingEvent?.type ??
                    (trainingEvent ? StaffMeetingTypeEnum.training : StaffMeetingTypeEnum.staff_meeting)) as StaffMeetingTypeEnum,
                attendeeIds: existingAttendees,
            };
        }

        const existingCategory = (lessonEvent as unknown as { category?: unknown })?.category;

        const baseTeacher = {
            mode: "teacher" as const,
            title: lessonEvent?.title ?? "",
            description: lessonEvent?.description ?? "",
            startDate: initialDates.startDate,
            endDate: initialDates.endDate,
            lessonType: lessonEvent?.lessonType ?? 0,
            groupId: lessonEvent?.groupId ?? 0,
            status: lessonEvent?.status ?? "planned",
            color: lessonEvent?.color ? Number(lessonEvent.color) : 1,
            isOnline: Boolean(lessonEvent?.is_online),
            category: (existingCategory ?? LessonCategoryEnum.standard) as LessonCategoryEnum,
            lessonPlan: lessonEvent?.lesson_plan ?? "",
            sendForReview: false,
        };

        return {
            kind: "teacher_single",
            isRecurring: false,
            ...baseTeacher,
            recurringStartDate: undefined,
            recurringEndDate: undefined,
            schedule: [],
        };
    }, [event, initialDates, isMethodist]);

    const form = useForm<TEventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues,
    });

    useEffect(() => {
        if (!isOpen) return;
        if (!isMethodist) return;

        const staffEvent = getStaffRaw(event);
        const trainingEvent = event?.rawTraining ?? null;
        const methodistEvent = staffEvent ?? trainingEvent;

        if (!methodistEvent) return;

        const ids =
            (Array.isArray(methodistEvent.attendee_ids) && methodistEvent.attendee_ids.length > 0
                    ? methodistEvent.attendee_ids
                    : Array.isArray(methodistEvent.attendees)
                        ? methodistEvent.attendees
                            .map((a) => a?.id)
                            .filter((x): x is number => typeof x === "number")
                        : []
            );

        form.setValue("attendeeIds", ids, { shouldDirty: false, shouldValidate: true });
    }, [isOpen, isMethodist, event, form]);

    useEffect(() => {
        if (!isOpen) return;
        form.reset(defaultValues);
    }, [isOpen, defaultValues, form]);

    useEffect(() => {
        if (!isOpen) return;
        if (!initialStart || !initialEnd) return;
        if (isEditing) return;

        form.setValue("startDate", initialStart, { shouldDirty: true, shouldValidate: true });
        form.setValue("endDate", initialEnd, { shouldDirty: true, shouldValidate: true });
        form.setValue("isRecurring", false, { shouldDirty: true, shouldValidate: true });

    }, [isOpen, initialStart, initialEnd, isEditing, form]);

    const isRecurring = form.watch("isRecurring");
    const startDateWatch = form.watch("startDate");
    const lessonTypeWatch = form.watch("lessonType");
    const selectedType = lessonTypes.find((t) => t.id === lessonTypeWatch);

    useEffect(() => {
        if (isRecurring) return;
        if (!isTeacher) return;

        const start = startDateWatch;
        const type = selectedType;
        if (!start || !type?.duration_minutes) return;

        const end = addMinutes(new Date(start), type.duration_minutes);
        form.setValue("endDate", end, { shouldValidate: true, shouldDirty: true });
    }, [isRecurring, startDateWatch, selectedType, form, isTeacher]);

    const onSubmit = async (values: TEventFormData) => {
        if (!teacherId) return;
        if (!canUseDialog) return;

        try {
            if (values.kind === "methodist") {
                const payload = {
                    title: values.title,
                    description: values.description || "",
                    attendee_ids: Array.isArray(values.attendeeIds) ? values.attendeeIds : [],
                    start_time: values.startDate.toISOString(),
                    end_time: values.endDate.toISOString(),
                    color_id: String(values.color ?? 1),
                    is_online: Boolean(values.isOnline),
                };

                const isTraining = isEditing
                    ? Boolean(event?.rawTraining)
                    : values.category === StaffMeetingTypeEnum.training;

                if (isEditing && event?.id) {
                    if (isTraining) {
                        await updateTraining({ id: Number(event.id), data: payload }).unwrap();
                    } else {
                        await updateStaffMeeting({
                            id: Number(event.id),
                            data: payload,
                        }).unwrap();
                    }
                } else {
                    if (isTraining) {
                        await createTraining(payload).unwrap();
                    } else {
                        await createStaffMeeting({ ...payload, type: values.category }).unwrap();
                    }
                }

                onSaved?.();
                setIsOpen(false);
                return;
            }

            if (values.kind === "teacher_recurring") {
                if (!values.recurringStartDate || !values.recurringEndDate) return;

                const scheduleForApi = values.schedule.map((s) => ({
                    ...s,
                    day_of_week: s.day_of_week - 1,
                }));

                await createRecurringLessons({
                    group_id: Number(values.groupId),
                    teacher_id: Number(teacherId),
                    lesson_type_id: Number(values.lessonType),
                    topic: values.title,
                    description: values.description || "",
                    color_id: String(values.color ?? 1),
                    is_online: Boolean(values.isOnline),
                    start_date: values.recurringStartDate.toISOString().slice(0, 10),
                    end_date: values.recurringEndDate.toISOString().slice(0, 10),
                    schedule: scheduleForApi,
                    category: values.category,
                }).unwrap();

                onSaved?.();
                setIsOpen(false);
                return;
            }

            if (values.kind === "teacher_single") {
                const payload = {
                    topic: values.title,
                    description: values.description || "",
                    start_time: values.startDate.toISOString(),
                    lesson_type_id: Number(values.lessonType),
                    group_id: Number(values.groupId),
                    teacher_id: Number(teacherId),
                    color_id: String(values.color ?? 1),
                    status: values.status,
                    category: values.category,
                    is_online: Boolean(values.isOnline),
                    lesson_plan: values.lessonPlan || "",
                };

                if (isEditing && event?.id) {
                    await updateLesson({ id: event.id, data: payload }).unwrap();
                    if (!isPlanSubmitted) {
                        await updateLessonPlan({
                            id: Number(event.id),
                            data: {
                                lesson_plan: values.lessonPlan || "",
                                send_for_review: Boolean(values.sendForReview),
                            },
                        }).unwrap();
                    }
                } else {
                    await createLesson(payload).unwrap();
                }

                onSaved?.();
                setIsOpen(false);
                return;
            }
        } catch (e) {
            console.error(e);
        }
    };

    const categoryWatch = form.watch("category");
    const isTrainingCategory = categoryWatch === StaffMeetingTypeEnum.training;

    const isSaving =
        isCreatingLesson ||
        isUpdatingLesson ||
        isCreatingRecurringLesson ||
        isCreatingStaffMeeting ||
        isUpdatingStaffMeeting||
        isCreatingTraining ||
        isUpdatingTraining ||
        isUpdatingLessonPlan;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}

            <DialogContent className="max-w-[525px] max-h-[600px] overflow-x-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Редагувати подію" : "Додати нову подію"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Відредагуйте існуючу подію." : "Створіть нову подію."}
                    </DialogDescription>
                </DialogHeader>

                {!canUseDialog ? (
                    <div className="rounded-xl border p-3 text-sm text-muted-foreground">
                        У вас немає прав для створення/редагування подій.
                    </div>
                ) : (
                    <Form {...form}>
                        <form
                            id="event-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="grid gap-4 py-4"
                        >
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field, fieldState }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="title" className="required">
                                            Назва події*
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                id="title"
                                                placeholder="Введіть назву події"
                                                {...field}
                                                className={fieldState.invalid ? "border-red-500" : ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {isTeacher ? (
                                <FormField
                                    control={form.control}
                                    name="isRecurring"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-3 rounded-xl border p-3">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={(v) => {
                                                        const next = Boolean(v);
                                                        field.onChange(next);

                                                        form.setValue("kind", next ? "teacher_recurring" : "teacher_single", {
                                                            shouldDirty: true,
                                                            shouldValidate: true,
                                                        });
                                                    }}
                                                />
                                            </FormControl>
                                            <div className="space-y-0.5">
                                                <FormLabel className="m-0">Створити серію (повторювані уроки)</FormLabel>
                                                <p className="text-xs text-muted-foreground">
                                                    Ввімкніть, щоб створити кілька подій за розкладом
                                                </p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            ) : null}

                            {!isRecurring && isTeacher ? (
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => <DateTimePickers form={form} field={field} />}
                                />
                            ) : null}

                            {!isRecurring && isMethodist ? (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="required">Початок*</FormLabel>
                                                <FormControl>
                                                    <DateTimePickers form={form} field={field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="required">Кінець*</FormLabel>
                                                <FormControl>
                                                    <DateTimePickers form={form} field={field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            ) : null}

                            {isRecurring ? (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="recurringStartDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="required">Початок періоду*</FormLabel>
                                                <FormControl>
                                                    <DateTimePickers form={form} field={field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="recurringEndDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="required">Кінець періоду*</FormLabel>
                                                <FormControl>
                                                    <DateTimePickers form={form} field={field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="schedule"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="required">Розклад*</FormLabel>
                                                <FormControl>
                                                    <SchedulePicker value={field.value} onChange={field.onChange} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            ) : null}

                            <FormField
                                control={form.control}
                                name="isOnline"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-3 rounded-xl border p-3">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(v) => field.onChange(Boolean(v))}
                                            />
                                        </FormControl>
                                        <div className="space-y-0.5">
                                            <FormLabel className="m-0">
                                                {isMethodist ? "Онлайн зустріч" : "Онлайн урок"}
                                            </FormLabel>
                                            <p className="text-xs text-muted-foreground">
                                                Якщо увімкнено — подія буде позначена як онлайн
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {isTeacher ? (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="lessonType"
                                        render={({ field, fieldState }) => (
                                            <FormItem>
                                                <FormLabel className="required">Тип уроку*</FormLabel>
                                                <FormControl>
                                                    <div className="flex gap-2">
                                                        <Select
                                                            value={field.value != null ? String(field.value) : ""}
                                                            onValueChange={(v) => field.onChange(Number(v))}
                                                        >
                                                            <SelectTrigger className={`w-full ${fieldState.invalid ? "border-red-500" : ""}`}>
                                                                <SelectValue placeholder="Оберіть тип уроку" />
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                {lessonTypes.map((t) => (
                                                                    <SelectItem key={t.id} value={String(t.id)}>
                                                                        {t.name} ({t.duration_minutes}хв)
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </FormControl>

                                                <LessonTypeManagerDialog
                                                    open={openTypes}
                                                    onOpenChange={setOpenTypes}
                                                    onPick={(id) => {
                                                        form.setValue("lessonType", id, { shouldValidate: true });
                                                        setOpenTypes(false);
                                                    }}
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="groupId"
                                        render={({ field, fieldState }) => (
                                            <FormItem>
                                                <FormLabel className="required">Група*</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value != null ? String(field.value) : ""}
                                                        onValueChange={(value) => field.onChange(Number(value))}
                                                    >
                                                        <SelectTrigger className={`w-full ${fieldState.invalid ? "border-red-500" : ""}`}>
                                                            <SelectValue
                                                                placeholder={
                                                                    groupError
                                                                        ? "Помилка завантаження"
                                                                        : !groupData
                                                                            ? "Завантаження..."
                                                                            : "Оберіть групу"
                                                                }
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {groupData?.results?.map((group) =>
                                                                group?.id && group?.name ? (
                                                                    <SelectItem key={group.id} value={group.id.toString()}>
                                                                        {group.name}
                                                                    </SelectItem>
                                                                ) : null
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field, fieldState }) => (
                                            <FormItem>
                                                <FormLabel className="required">Статус*</FormLabel>
                                                <FormControl>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger className={`w-full ${fieldState.invalid ? "border-red-500" : ""}`}>
                                                            <SelectValue placeholder="Оберіть статус" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(statusLessonsForTeacher).map(([key, label]) => (
                                                                <SelectItem value={key} key={key}>
                                                                    {label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            ) : null}

                            {isMethodist ? (
                                <>
                                    {!isEditing ? (
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field, fieldState }) => (
                                                <FormItem>
                                                    <FormLabel className="required">Тип зустрічі*</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            value={String(field.value ?? StaffMeetingTypeEnum.staff_meeting)}
                                                            onValueChange={(v) => field.onChange(v)}
                                                        >
                                                            <SelectTrigger className={`w-full ${fieldState.invalid ? "border-red-500" : ""}`}>
                                                                <SelectValue placeholder="Оберіть тип" />
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                {Object.entries(STAFF_MEETING_TYPE_LABELS).map(([key, label]) => (
                                                                    <SelectItem key={key} value={key}>
                                                                        {label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ) : null}

                                    <FormField
                                        control={form.control}
                                        name="attendeeIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Запрошені</FormLabel>
                                                <FormControl>
                                                    <AttendeesPicker
                                                        value={Array.isArray(field.value) ? field.value : []}
                                                        onChange={field.onChange}
                                                        onlyTeachers={isTrainingCategory}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            ) : null}

                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field, fieldState }) => (
                                    <FormItem>
                                        <FormLabel className="required">Колір</FormLabel>
                                        <FormControl>
                                            <Select
                                                value={field.value?.toString() || ""}
                                                onValueChange={(value) => field.onChange(Number(value))}
                                                disabled={isLoadingColors || !!colorError}
                                            >
                                                <SelectTrigger className={`w-full ${fieldState.invalid ? "border-red-500" : ""}`}>
                                                    <SelectValue
                                                        placeholder={
                                                            colorError
                                                                ? "Помилка завантаження"
                                                                : isLoadingColors
                                                                    ? "Завантаження кольорів..."
                                                                    : "Оберіть колір"
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Colors?.map((color) => (
                                                        <SelectItem key={color.id} value={String(color.id)}>
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-3.5 rounded-full border" style={{ backgroundColor: color.hex }} />
                                                                <span>{color.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field, fieldState }) => (
                                    <FormItem>
                                        <FormLabel className="required">Опис</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Опис події"
                                                className={fieldState.invalid ? "border-red-500" : ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {isTeacher && !isRecurring ? (
                                <div className="grid gap-3">
                                    <FormField
                                        control={form.control}
                                        name="lessonPlan"
                                        render={({ field, fieldState }) => (
                                            <FormItem>
                                                <FormLabel>План уроку</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        disabled={isPlanSubmitted}
                                                        placeholder="Наприклад: цілі, структура, матеріали, домашнє..."
                                                        className={
                                                        `${fieldState.invalid ? "border-red-500" : ""}
                                                        ${isLessonPlanLocked ? "opacity-60 cursor-not-allowed" : ""}`
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {!isPlanSubmitted ? (
                                        <FormField
                                            control={form.control}
                                            name="sendForReview"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center gap-3 rounded-xl border p-3">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={Boolean(field.value)}
                                                            onCheckedChange={(v) => field.onChange(Boolean(v))}
                                                        />
                                                    </FormControl>

                                                    <div className="space-y-0.5">
                                                        <FormLabel className="m-0">
                                                            Надіслати план на перевірку
                                                        </FormLabel>
                                                        <p className="text-xs text-muted-foreground">
                                                            Після збереження методист зможе схвалити або відхилити план
                                                        </p>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    ) : null}
                                </div>
                            ) : null}

                            {isRecurring && isTeacher ? (
                                <p className="text-xs text-muted-foreground">
                                    План уроку заповнюється окремо для кожного заняття
                                </p>
                            ) : null}
                        </form>
                    </Form>
                )}

                <DialogFooter className="flex justify-end gap-2">
                    <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setIsOpen(false)}>
                        Скасувати
                    </Button>

                    <Button form="event-form" type="submit" disabled={!teacherId || isSaving || !canUseDialog}>
                        {isEditing ? "Зберегти зміни" : "Створити подію"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
