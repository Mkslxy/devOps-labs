import React, {useEffect, useMemo} from "react";
import {useFieldArray, useForm} from "react-hook-form";
import {toast} from "sonner";
import {ArrowLeft, Plus, Trash2} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Checkbox} from "@/components/ui/checkbox";
import {Separator} from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useRouter } from "next/navigation";

import {type Question, type QuestionPayload, type QuestionOption, TypeEnum} from "@/store/test-management/test-management.type";
import {TYPE_LABELS} from "@/store/test-management/test-management.labels";

type Props = {
    mode: "create" | "edit";
    initialQuestion?: Question;
    isLoading?: boolean;
    onSubmit: (payload: QuestionPayload) => Promise<any>;
    onCancel?: () => void;
};

function normalizePayload(values: QuestionPayload, mode: "create" | "edit"): QuestionPayload {
    const type = values.type;

    const options = (values.options ?? []).map((o) => {
        const base: QuestionOption = {
            option_text: o.option_text?.trim() ?? "",
        };

        if (mode === "edit" && o.id) base.id = o.id;

        if (type === TypeEnum.single_choice || type === TypeEnum.multiple_choice) {
            base.is_correct = !!o.is_correct;
            base.explanation = o.explanation?.trim() || undefined;
        }

        if (type === TypeEnum.ordering) {
            base.correct_order = o.correct_order;
        }

        if (type === TypeEnum.matching) {
            base.match_pair_text = o.match_pair_text?.trim() || undefined;
        }

        if (type === TypeEnum.fill_in_the_blank) {
            base.blank_group_id = o.blank_group_id;
        }

        return base;
    });

    return {
        text: values.text.trim(),
        media_url: values.media_url?.trim() ? values.media_url.trim() : null,
        points: Number(values.points ?? 0),
        type,
        explanation: values.explanation?.trim() ?? "",
        options: type === TypeEnum.open_text ? [] : options,
    };
}

function validate(values: QuestionPayload): string | null {
    if (!values.text?.trim()) return "Текст питання є обов’язковим";
    if (values.points == null || Number.isNaN(Number(values.points))) return "Бали мають бути числом";
    if (Number(values.points) < 0) return "Бали не можуть бути менше 0";

    const type = values.type;

    if (type === TypeEnum.open_text) return null;

    if (!values.options || values.options.length < 2) {
        return "Додайте щонайменше 2 варіанти";
    }

    if (type === TypeEnum.single_choice) {
        const correctCount = (values.options ?? []).filter((o) => o.is_correct).length;
        if (correctCount !== 1) return "Для цього типу має бути рівно 1 правильна відповідь";
    }

    if (type === TypeEnum.multiple_choice) {
        const correctCount = (values.options ?? []).filter((o) => o.is_correct).length;
        if (correctCount < 1) return "Позначте щонайменше 1 правильну відповідь";
    }

    if (type === TypeEnum.ordering) {
        const orders = (values.options ?? []).map((o) => o.correct_order);
        if (orders.some((x) => x == null || Number.isNaN(Number(x)))) return "Заповніть порядок для кожного варіанта";

        const nums = orders.map((x) => Number(x));
        const set = new Set(nums);
        if (set.size !== nums.length) return "Порядок не може повторюватись";
    }

    if (type === TypeEnum.matching) {
        const bad = (values.options ?? []).some((o) => !o.match_pair_text?.trim());
        if (bad) return "Заповніть пару для кожного варіанта";
    }

    if (type === TypeEnum.fill_in_the_blank) {
        const bad = (values.options ?? []).some((o) => o.blank_group_id == null || Number(o.blank_group_id) <= 0);
        if (bad) return "Заповніть номер групи пропуску (>= 1) для кожного варіанта";
    }

    return null;
}

export function QuestionForm({mode, initialQuestion, isLoading, onSubmit, onCancel}: Props) {
    const router = useRouter();

    const form = useForm<QuestionPayload>({
        defaultValues: {
            text: "",
            media_url: null,
            points: 0,
            type: TypeEnum.single_choice,
            explanation: "",
            options: [
                {option_text: "", is_correct: true},
                {option_text: "", is_correct: false},
            ],
        },
    });

    const {control, watch, reset, handleSubmit, setValue, getValues} = form;

    const {fields, append, remove, replace} = useFieldArray({
        control,
        name: "options",
    });

    useEffect(() => {
        if (mode === "edit" && initialQuestion) {
            const v: QuestionPayload = {
                text: initialQuestion.text ?? "",
                media_url: initialQuestion.media_url ?? null,
                points: initialQuestion.points ?? 0,
                type: initialQuestion.type,
                explanation: initialQuestion.explanation ?? "",
                options: (initialQuestion.options ?? []).map((o) => ({
                    id: o.id,
                    option_text: o.option_text ?? "",
                    is_correct: !!o.is_correct,
                    explanation: o.explanation ?? "",
                    match_pair_text: o.match_pair_text ?? "",
                    correct_order: o.correct_order,
                    blank_group_id: o.blank_group_id,
                })),
            };
            reset(v);
            replace(v.options ?? []);
        }
    }, [mode, initialQuestion?.id]);

    const type = watch("type");
    const options = watch("options");

    const showOptions = useMemo(() => type !== TypeEnum.open_text, [type]);

    useEffect(() => {
        if (type !== TypeEnum.single_choice) return;

        const idx = (options ?? []).findIndex((o) => o.is_correct);
        if (idx === -1 && (options?.length ?? 0) > 0) {
            setValue("options.0.is_correct", true);
            return;
        }
        (options ?? []).forEach((_o, i) => {
            if (i !== idx && options[i]?.is_correct) setValue(`options.${i}.is_correct`, false);
        });
    }, [type]);

    const addOption = () =>
        append({
            option_text: "",
            is_correct: false,
            explanation: "",
            match_pair_text: "",
            correct_order: undefined,
            blank_group_id: undefined,
        });

    const submit = async (values: QuestionPayload) => {
        const normalized = normalizePayload(values, mode);

        if (normalized.type === TypeEnum.open_text) normalized.options = [];

        const error = validate(normalized);
        if (error) {
            toast.error(error);
            return;
        }

        try {
            await onSubmit(normalized);
            toast.success(mode === "create" ? "Питання створено" : "Питання оновлено");
        } catch (e: any) {
            toast.error(e?.data?.detail ?? "Помилка запиту");
        }
    };

    const isChoice = type === TypeEnum.single_choice || type === TypeEnum.multiple_choice;
    const isOrdering = type === TypeEnum.ordering;
    const isMatching = type === TypeEnum.matching;
    const isBlanks = type === TypeEnum.fill_in_the_blank;

    return (
        <form onSubmit={handleSubmit(submit)} className="space-y-6">
            <Card className="bg-card border-border ">
                <CardHeader>
                    <div className="items-center flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <CardTitle>{mode === "create" ? "Створення питання" : "Редагування питання"}</CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Текст питання</div>
                        <Textarea
                            value={watch("text")}
                            onChange={(e) => setValue("text", e.target.value)}
                            required
                            data-required-label="Текст питання"
                            placeholder="Введіть текст питання..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Бали</div>
                            <Input
                                type="number"
                                min={0}
                                step={1}
                                value={watch("points")}
                                onChange={(e) => setValue("points", Number(e.target.value))}
                                required
                                data-required-label="Бали"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Тип</div>

                            <Select
                                value={type}
                                onValueChange={(v) => setValue("type", v as TypeEnum)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Оберіть тип" />
                                </SelectTrigger>

                                <SelectContent className="w-full">
                                    {(Object.values(TypeEnum) as TypeEnum[]).map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {TYPE_LABELS[t]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Посилання на медіа</div>
                            <Input
                                placeholder="https://..."
                                value={watch("media_url") ?? ""}
                                onChange={(e) => setValue("media_url", e.target.value || null)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm font-medium">Пояснення</div>
                        <Textarea
                            value={watch("explanation")}
                            onChange={(e) => setValue("explanation", e.target.value)}
                            placeholder="Необов’язково..."
                        />
                    </div>

                    <Separator/>

                    {showOptions ? (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between gap-2 md:gap-0">
                                <div className="font-medium text-left">Варіанти відповіді</div>
                                <Button type="button" variant="secondary" onClick={addOption}>
                                    <Plus className="w-4 h-4 mr-2"/>
                                    Додати варіант
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {fields.map((f, index) => (
                                    <Card key={f.id} className="bg-card border-border">
                                        <CardContent className="pt-5 space-y-4">
                                            <div className="relative flex flex-col md:flex-row md:items-stretch md:justify-between gap-3">
                                                <div className="flex-1 space-y-3">
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium">Текст варіанта</div>
                                                        <Input
                                                            placeholder="Додайте варіант текста"
                                                            value={options?.[index]?.option_text ?? ""}
                                                            onChange={(e) => setValue(`options.${index}.option_text`, e.target.value)}
                                                            required
                                                            data-required-label={`Текст варіанта ${index + 1}`}
                                                        />
                                                    </div>

                                                    {isChoice ? (
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox
                                                                checked={!!options?.[index]?.is_correct}
                                                                onCheckedChange={(checked) => {
                                                                    const isChecked = checked === true;

                                                                    if (type === TypeEnum.single_choice && isChecked) {
                                                                        const all = getValues("options") ?? [];
                                                                        all.forEach((_o, i) => setValue(`options.${i}.is_correct`, i === index));
                                                                    } else {
                                                                        setValue(`options.${index}.is_correct`, isChecked);
                                                                    }
                                                                }}
                                                            />
                                                            <div className="text-sm">Правильна</div>
                                                        </div>
                                                    ) : null}

                                                    {isOrdering ? (
                                                        <div className="space-y-2">
                                                            <div className="text-sm font-medium">Порядок</div>
                                                            <Input
                                                                type="number"
                                                                placeholder="1,2,3..."
                                                                value={options?.[index]?.correct_order ?? ""}
                                                                onChange={(e) =>
                                                                    setValue(
                                                                        `options.${index}.correct_order`,
                                                                        e.target.value === "" ? undefined : Number(e.target.value)
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    ) : null}

                                                    {isBlanks ? (
                                                        <div className="space-y-2">
                                                            <div className="text-sm font-medium">Номер групи пропуску</div>
                                                            <Input
                                                                type="number"
                                                                placeholder="1,2,3..."
                                                                value={options?.[index]?.blank_group_id ?? ""}
                                                                onChange={(e) =>
                                                                    setValue(
                                                                        `options.${index}.blank_group_id`,
                                                                        e.target.value === "" ? undefined : Number(e.target.value)
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    ) : null}

                                                    {isMatching ? (
                                                        <div className="space-y-2">
                                                            <div className="text-sm font-medium">Пара для відповідності</div>
                                                            <Input
                                                                placeholder="Напр. A / Київ / 2024..."
                                                                value={options?.[index]?.match_pair_text ?? ""}
                                                                onChange={(e) => setValue(`options.${index}.match_pair_text`, e.target.value)}
                                                            />
                                                        </div>
                                                    ) : null}

                                                    {isChoice ? (
                                                        <div className="space-y-2">
                                                            <div className="text-sm font-medium">Пояснення до варіанта</div>
                                                            <Textarea
                                                                placeholder="Додайте пояснення до варіанта"
                                                                value={options?.[index]?.explanation ?? ""}
                                                                onChange={(e) => setValue(`options.${index}.explanation`, e.target.value)}
                                                            />
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="absolute top-[-10px] right-[-10px] md:static md:flex md:flex-col md:justify-start">
                                                    <Button
                                                        className="cursor-pointer"
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => remove(index)}
                                                        disabled={
                                                            fields.length <= 2
                                                        }
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            Для відкритої відповіді варіанти не потрібні.
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
                {onCancel ? (
                    <Button className="cursor-pointer" type="button" variant="ghost" onClick={onCancel}>
                        Скасувати
                    </Button>
                ) : null}

                <Button className="cursor-pointer" type="submit" disabled={!!isLoading}>
                    {mode === "create" ? "Створити" : "Зберегти"}
                </Button>
            </div>
        </form>
    );
}
