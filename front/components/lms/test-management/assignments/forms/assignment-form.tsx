import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { TestAssignment, TestAssignmentPayload, StatusDaeEnum } from "@/store/test-management/test-management.type";
import { STATUS_DAE_LABELS } from "@/store/test-management/test-management.labels";
import {DateTimePicker} from "@/components/ui/date-time-picker";
import {Checkbox} from "@/components/ui/checkbox";
import {Label} from "@radix-ui/react-label";

type Mode = "create" | "edit";

type SelectOption = { id: number; label: string };

type VersionOption = {
    id: number;
    testId: number;
    label: string;
    status: StatusDaeEnum;
};

type Props = {
    mode: Mode;
    initialAssignment?: TestAssignment;
    isLoading?: boolean;

    tests: SelectOption[];
    versions: VersionOption[];
    lessons: SelectOption[];
    materials: SelectOption[];
    groups?: SelectOption[];

    onSubmit: (payload: TestAssignmentPayload) => Promise<any>;
    onCancel?: () => void;
};

const n2s = (v?: number | null) => (v && v > 0 ? String(v) : "");
const s2n = (v: string) => (v ? Number(v) : 0);

function normalizeDatetimeForInput(value?: string | null) {
    if (!value) return "";
    return value.slice(0, 16);
}

function SelectSkeleton({ placeholder }: { placeholder: string }) {
    return (
        <div className="w-full">
            <Input disabled placeholder={placeholder} />
        </div>
    );
}

function validatePayload(v: TestAssignmentPayload): string | null {
    if (!v.test_id) return "Оберіть тест";
    if (!v.pinned_version_id) return "Оберіть версію тесту";

    const picked = [v.lesson_id, v.material_id, v.group_id].filter((x) => !!x).length;

    if (picked === 0) return "Оберіть або урок, або матеріал, або групу";
    if (picked > 1) return "Можна обрати тільки один контекст: урок АБО матеріал АБО групу";

    if (!v.starting_at) return "Вкажіть дату початку";
    if (!v.closing_at) return "Вкажіть дату закриття";

    if (v.starting_at && v.closing_at && v.starting_at > v.closing_at) {
        return "Дата початку має бути раніше дати закриття";
    }

    const timeLimit = v.custom_time_limit ?? 0;
    if (Number.isNaN(Number(timeLimit)) || Number(timeLimit) < 0) {
        return "Ліміт часу має бути числом і не менше 0";
    }

    const passing = v.custom_passing_score ?? 0;
    if (Number.isNaN(Number(passing)) || Number(passing) < 0 || Number(passing) > 100) {
        return "Прохідний відсоток має бути від 0 до 100";
    }

    return null;
}

export function AssignmentForm({
                                   mode,
                                   initialAssignment,
                                   isLoading,
                                   tests,
                                   versions,
                                   lessons,
                                   materials,
                                   groups,
                                   onSubmit,
                                   onCancel,
                               }: Props) {
    const router = useRouter();

    const form = useForm<TestAssignmentPayload>({
        defaultValues: {
            test_id: 0,
            pinned_version_id: null,
            lesson_id: null,
            material_id: null,
            group_id: null,
            custom_time_limit: 0,
            custom_passing_score: 0,
            starting_at: "",
            closing_at: "",
            show_answers: false,
        },
    });

    const { watch, reset, handleSubmit, setValue } = form;

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (mode !== "edit") return;
        if (!initialAssignment?.id) return;

        reset(
            {
                test_id: initialAssignment.test?.id ?? 0,
                pinned_version_id: initialAssignment.pinned_version?.id ?? null,
                lesson_id: initialAssignment.lesson?.id ?? null,
                material_id: initialAssignment.material?.id ?? null,
                group_id: (initialAssignment as any)?.group?.id ?? null,
                custom_time_limit: initialAssignment.custom_time_limit ?? 0,
                custom_passing_score: initialAssignment.custom_passing_score ?? 0,
                starting_at: normalizeDatetimeForInput(initialAssignment.starting_at),
                closing_at: normalizeDatetimeForInput(initialAssignment.closing_at),
                show_answers: initialAssignment.show_answers ?? true,
            },
            { keepDirty: false, keepTouched: false }
        );
    }, [mode, initialAssignment?.id, reset]);

    const testId = watch("test_id");
    const pinnedVersionId = watch("pinned_version_id");
    const lessonId = watch("lesson_id");
    const materialId = watch("material_id");

    const groupId = watch("group_id");

    const isLessonLocked = Boolean(materialId || groupId);
    const isMaterialLocked = Boolean(lessonId || groupId);
    const isGroupLocked = Boolean(lessonId || materialId);

    const filteredVersions = useMemo(() => {
        if (!testId) return [];
        return versions.filter((v) => v.testId === testId);
    }, [versions, testId]);

    // якщо змінив тест — скинути версію (тільки для create)
    useEffect(() => {
        if (mode === "edit") return;

        if (!testId) {
            setValue("pinned_version_id", null);
            return;
        }

        const current = pinnedVersionId;
        const ok = current ? filteredVersions.some((v) => v.id === current) : false;
        if (!ok) setValue("pinned_version_id", null);
    }, [testId, filteredVersions.length, mode, pinnedVersionId, setValue]);

    useEffect(() => {
        if (mode === "edit") return;
        if (lessonId) {
            setValue("material_id", null);
            setValue("group_id", null);
        }
    }, [lessonId, mode, setValue]);

    useEffect(() => {
        if (mode === "edit") return;
        if (materialId) {
            setValue("lesson_id", null);
            setValue("group_id", null);
        }
    }, [materialId, mode, setValue]);

    useEffect(() => {
        if (mode === "edit") return;
        if (groupId) {
            setValue("lesson_id", null);
            setValue("material_id", null);
        }
    }, [groupId, mode, setValue]);

    const submit = async (values: TestAssignmentPayload) => {
        const err = validatePayload(values);
        if (err) {
            toast.error(err);
            return;
        }

        try {
            const payload: TestAssignmentPayload = {
                ...values,
                lesson_id: values.lesson_id || null,
                material_id: values.material_id || null,
                group_id: values.group_id || null,
                pinned_version_id: values.pinned_version_id || null,
                closing_at: values.closing_at || null,
            };

            await onSubmit(payload);
            toast.success(mode === "create" ? "Призначення створено" : "Призначення оновлено");
        } catch (e: any) {
            const data = e?.data;
            const msg =
                data?.detail ??
                data?.non_field_errors?.[0] ??
                data?.pinned_version_id?.[0] ??
                data?.lesson_id?.[0] ??
                data?.material_id?.[0] ??
                data?.group_id?.[0] ??
                "Помилка запиту";

            toast.error(msg);
        }
    };

    const ready = mounted && !isLoading;

    return (
        <form onSubmit={handleSubmit(submit)} className="space-y-6 w-full">
            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => (onCancel ? onCancel() : router.back())}
                            className="cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>

                        <CardTitle>{mode === "create" ? "Створення призначення" : "Редагування призначення"}</CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Тест</div>
                        {!ready ? (
                            <SelectSkeleton placeholder="Завантаження тестів..." />
                        ) : (
                            <Select value={n2s(testId)} onValueChange={(v) => setValue("test_id", s2n(v))}>
                                <SelectTrigger
                                    className="w-full"
                                    data-required-empty={!testId ? "true" : "false"}
                                    data-required-label="Тест"
                                >
                                    <SelectValue placeholder="Оберіть тест" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tests.map((t) => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm font-medium">Версія тесту</div>
                        {!ready ? (
                            <SelectSkeleton placeholder="Завантаження версій..." />
                        ) : (
                            <Select
                                value={n2s(pinnedVersionId ?? null)}
                                onValueChange={(v) => setValue("pinned_version_id", s2n(v) || null)}
                                disabled={!testId}
                            >
                                <SelectTrigger
                                    className="w-full"
                                    data-required-empty={!pinnedVersionId ? "true" : "false"}
                                    data-required-label="Версія тесту"
                                >
                                    <SelectValue placeholder={testId ? "Оберіть версію" : "Спочатку оберіть тест"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredVersions.map((v) => (
                                        <SelectItem key={v.id} value={String(v.id)}>
                                            <div className="flex items-center justify-between gap-2 w-full">
                                                <span>{v.label}</span>
                                                {v.status !== StatusDaeEnum.published && (
                                                    <span className="text-xs text-muted-foreground">{STATUS_DAE_LABELS[v.status]}</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">Урок</div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={!lessonId}
                                onClick={() => setValue("lesson_id", null)}
                                className="h-7 px-2 cursor-pointer"
                            >
                                Очистити
                            </Button>
                        </div>

                        {!ready ? (
                            <SelectSkeleton placeholder="Завантаження уроків..." />
                        ) : (
                            <Select
                                value={n2s(lessonId ?? null)}
                                onValueChange={(v) => setValue("lesson_id", s2n(v) || null)}
                                disabled={isLessonLocked}
                            >
                                <SelectTrigger
                                    className="w-full"
                                    data-required-empty={!lessonId && !materialId && !groupId ? "true" : "false"}
                                    data-required-label="Урок, матеріал або група"
                                >
                                    <SelectValue placeholder={isLessonLocked ? "Заблоковано (обрано матеріал)" : "Оберіть урок"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {lessons.map((l) => (
                                        <SelectItem key={l.id} value={String(l.id)}>
                                            {l.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">Матеріал</div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={!materialId}
                                onClick={() => setValue("material_id", null)}
                                className="h-7 px-2 cursor-pointer"
                            >
                                Очистити
                            </Button>
                        </div>

                        {!ready ? (
                            <SelectSkeleton placeholder="Завантаження матеріалів..." />
                        ) : (
                            <Select
                                value={n2s(materialId ?? null)}
                                onValueChange={(v) => setValue("material_id", s2n(v) || null)}
                                disabled={isMaterialLocked}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={isMaterialLocked ? "Заблоковано (обрано урок)" : "Оберіть матеріал"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {materials.map((m) => (
                                        <SelectItem key={m.id} value={String(m.id)}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {groups?.length ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">Група</div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={!groupId}
                                    onClick={() => setValue("group_id", null)}
                                    className="h-7 px-2 cursor-pointer"
                                >
                                    Очистити
                                </Button>
                            </div>

                            {!ready ? (
                                <SelectSkeleton placeholder="Завантаження груп..." />
                            ) : (
                                <Select
                                    value={n2s(groupId ?? null)}
                                    onValueChange={(v) => setValue("group_id", s2n(v) || null)}
                                    disabled={isGroupLocked}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue
                                            placeholder={
                                                isGroupLocked
                                                    ? "Заблоковано (обрано урок або матеріал)"
                                                    : "Оберіть групу"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups.map((g) => (
                                            <SelectItem key={g.id} value={String(g.id)}>
                                                {g.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    ) : null}

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Ліміт часу (хвилини)</div>
                            <Input
                                type="number"
                                min={0}
                                value={String(watch("custom_time_limit") ?? 0)}
                                onChange={(e) => setValue("custom_time_limit", Number(e.target.value))}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Прохідний відсоток</div>
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                value={String(watch("custom_passing_score") ?? 0)}
                                onChange={(e) => setValue("custom_passing_score", Number(e.target.value))}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Дата початку</div>
                            <DateTimePicker
                                value={watch("starting_at")}
                                onChange={(v) => setValue("starting_at", v ?? "")}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Дата закриття</div>
                            <DateTimePicker
                                value={watch("closing_at")}
                                minDate={watch("starting_at") ? new Date(watch("starting_at")) : undefined}
                                onChange={(v) => setValue("closing_at", v ?? "")}
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Checkbox
                                checked={!!watch("show_answers")}
                                onCheckedChange={(v) => setValue("show_answers", v === true)}
                                id="show_answers"
                            />
                            <Label htmlFor="show_answers" className="text-sm">
                                Показувати відповіді студенту після проходження
                            </Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => (onCancel ? onCancel() : router.back())}
                >
                    Скасувати
                </Button>

                <Button type="submit" disabled={!!isLoading} className="cursor-pointer">
                    {mode === "create" ? "Створити" : "Зберегти"}
                </Button>
            </div>
        </form>
    );
}
