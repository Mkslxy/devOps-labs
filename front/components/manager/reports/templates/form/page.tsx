"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FrequencyEnum,
    ReportTemplate,
    ReportTemplatePayload,
} from "@/store/reports/report-template.type";
import {
    useCreateReportTemplateMutation,
    useUpdateReportTemplateMutation,
} from "@/store/reports/report-template.api";
import { EditorContent, useEditor } from "@tiptap/react";
import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import {
    ArrowLeft,
    Bold,
    Heading2,
    Italic,
    List,
    ListOrdered,
    Minus,
    Redo,
    Save,
    SquarePen,
    UnderlineIcon,
    Undo,
} from "lucide-react";
import { ReportTemplateRolesSelect } from "@/components/manager/reports/templates/ui/report-template-roles-select/page";

interface ReportTemplateFormProps {
    mode: "create" | "edit";
    template?: ReportTemplate | null;
}

const ReportField = Node.create({
    name: "reportField",

    group: "inline",

    inline: true,

    atom: true,

    selectable: true,

    addAttributes() {
        return {
            id: {
                default: "",
                parseHTML: (element) =>
                    element.getAttribute("data-field-id") ||
                    element.getAttribute("id") ||
                    "",
            },
            label: {
                default: "Поле для заповнення",
                parseHTML: (element) =>
                    element.getAttribute("data-field-label") ||
                    element.textContent ||
                    "Поле для заповнення",
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: "span[data-report-field]",
            },
        ];
    },

    renderHTML({ node }) {
        return [
            "span",
            {
                "data-report-field": "true",
                "data-field-id": node.attrs.id,
                "data-field-label": node.attrs.label,
                class:
                    "inline-flex max-w-full min-w-[72px] items-center justify-center rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground whitespace-normal break-words align-baseline",
            },
            node.attrs.label || "Поле для заповнення",
        ];
    },
});

export function ReportTemplateForm({
                                       mode,
                                       template,
                                   }: ReportTemplateFormProps) {
    const router = useRouter();

    const [formData, setFormData] = useState<ReportTemplatePayload>({
        title: "",
        description: "",
        content_html: "",
        is_active: true,
        is_recurring: false,
        frequency: undefined,
        auto_assign_to_roles: [],
    });

    const [fieldLabel, setFieldLabel] = useState("");
    const [errorText, setErrorText] = useState("");

    const [createReportTemplate, { isLoading: isCreating }] =
        useCreateReportTemplateMutation();

    const [updateReportTemplate, { isLoading: isUpdating }] =
        useUpdateReportTemplateMutation();

    const isLoading = isCreating || isUpdating;

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            ReportField,
            Placeholder.configure({
                placeholder: "Напишіть приклад звіту...",
            }),
        ],
        content: "",
        onUpdate: ({ editor }) => {
            setFormData((prev) => ({
                ...prev,
                content_html: editor.getHTML(),
            }));
        },
        editorProps: {
            attributes: {
                class:
                    "min-h-[260px] sm:min-h-[340px] lg:min-h-[430px] w-full max-w-full overflow-hidden break-words px-3 sm:px-4 py-3 text-sm outline-none prose prose-sm max-w-none [&_*]:max-w-full [&_*]:break-words",
            },
        },
    });

    useEffect(() => {
        if (mode === "edit" && template) {
            const nextContent = template.content_html || "";

            setFormData({
                title: template.title || "",
                description: template.description || "",
                content_html: nextContent,
                is_active: template.is_active ?? true,
                is_recurring: template.is_recurring ?? false,
                frequency:
                    template.frequency &&
                    Object.values(FrequencyEnum).includes(
                        template.frequency as FrequencyEnum
                    )
                        ? (template.frequency as FrequencyEnum)
                        : undefined,
                auto_assign_to_roles:
                    template.auto_assign_to_roles?.map((role) =>
                        typeof role === "number"
                            ? role
                            : (role as { id: number }).id
                    ) || [],
            });

            editor?.commands.setContent(nextContent, {
                emitUpdate: false,
            });

            setErrorText("");

            return;
        }

        if (mode === "create") {
            setFormData({
                title: "",
                description: "",
                content_html: "",
                is_active: true,
                is_recurring: false,
                frequency: undefined,
                auto_assign_to_roles: [],
            });

            editor?.commands.setContent("", {
                emitUpdate: false,
            });

            setFieldLabel("");
            setErrorText("");
        }
    }, [mode, template, editor]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorText("");

        if (!formData.title.trim()) {
            setErrorText('Заповніть поле "Назва".');
            return;
        }

        if (!editor?.getText().trim()) {
            setErrorText('Заповніть поле "Шаблон звіту".');
            return;
        }

        const payload: ReportTemplatePayload = {
            title: formData.title,
            description: formData.description || undefined,
            content_html: formData.content_html,
            is_active: formData.is_active,
            is_recurring: formData.is_recurring,
            frequency: formData.is_recurring ? formData.frequency : undefined,
            auto_assign_to_roles: formData.auto_assign_to_roles || [],
        };

        if (mode === "edit" && template) {
            await updateReportTemplate({
                id: template.id,
                data: payload,
            }).unwrap();
        }

        if (mode === "create") {
            await createReportTemplate(payload).unwrap();
        }

        router.push("/dashboard/manager/reports/templates");
    };

    return (
        <div className="space-y-3 overflow-x-hidden px-3 pb-6 sm:space-y-4 sm:px-4">
            <div className="flex items-start justify-between gap-3 border-b pb-3 sm:items-center sm:pb-4">
                <div className="min-w-0 space-y-1">
                    <h1 className="text-xl font-bold leading-tight sm:text-2xl">
                        {mode === "edit"
                            ? "Редагувати шаблон звіту"
                            : "Додати шаблон звіту"}
                    </h1>

                    <p className="text-xs text-muted-foreground sm:text-sm">
                        Заповніть основні дані, оберіть ролі та створіть шаблон.
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0 gap-2"
                    onClick={() =>
                        router.push("/dashboard/manager/reports/templates")
                    }
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Назад</span>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-x-hidden">
                {errorText ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                        {errorText}
                    </div>
                ) : null}

                <div className="grid min-w-0 gap-4 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
                    <div className="min-w-0 space-y-3 sm:space-y-4">
                        <Card className="min-w-0 space-y-3 p-3 sm:p-4">
                            <div className="space-y-2">
                                <Label>Назва *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            title: e.target.value,
                                        })
                                    }
                                    placeholder="Наприклад: Звіт по ефективності"
                                    required
                                    aria-invalid={Boolean(errorText && !formData.title.trim())}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Опис</Label>
                                <Textarea
                                    value={formData.description || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="Короткий опис шаблону"
                                    rows={3}
                                    className="min-h-[84px]"
                                />
                            </div>
                        </Card>

                        <ReportTemplateRolesSelect
                            value={formData.auto_assign_to_roles || []}
                            disabled={isLoading}
                            onChange={(roles) =>
                                setFormData({
                                    ...formData,
                                    auto_assign_to_roles: roles,
                                })
                            }
                        />

                        <Card className="min-w-0 space-y-3 p-3 sm:p-4">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
                                    <div className="space-y-1">
                                        <Label>Активний</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Доступний працівникам
                                        </p>
                                    </div>

                                    <Checkbox
                                        checked={Boolean(formData.is_active)}
                                        onCheckedChange={(checked) =>
                                            setFormData({
                                                ...formData,
                                                is_active: Boolean(checked),
                                            })
                                        }
                                    />
                                </label>

                                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
                                    <div className="space-y-1">
                                        <Label>Регулярний</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Має частоту
                                        </p>
                                    </div>

                                    <Checkbox
                                        checked={Boolean(formData.is_recurring)}
                                        onCheckedChange={(checked) =>
                                            setFormData({
                                                ...formData,
                                                is_recurring: Boolean(checked),
                                                frequency: checked
                                                    ? formData.frequency
                                                    : undefined,
                                            })
                                        }
                                    />
                                </label>
                            </div>

                            {formData.is_recurring && (
                                <div className="space-y-2">
                                    <Label>Частота</Label>

                                    <Select
                                        value={(formData.frequency as string) || ""}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                frequency: value as FrequencyEnum,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Оберіть частоту" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value={FrequencyEnum.daily}>
                                                День
                                            </SelectItem>
                                            <SelectItem value={FrequencyEnum.weekly}>
                                                Тиждень
                                            </SelectItem>
                                            <SelectItem value={FrequencyEnum.monthly}>
                                                Місяць
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </Card>
                    </div>

                    <Card className="min-w-0 space-y-3 p-3 sm:p-4">
                        <div className="space-y-1">
                            <Label>Шаблон звіту *</Label>
                            <p className="text-xs text-muted-foreground">
                                Додайте текст і поля, які працівник потім заповнить.
                            </p>
                        </div>

                        <div
                            className="min-w-0 overflow-hidden rounded-xl border bg-background"
                            data-field-root
                            data-required-empty={!editor?.getText().trim() ? "true" : "false"}
                            data-required-label="Шаблон звіту"
                            tabIndex={-1}
                        >
                            <div className="flex w-full flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-2 sm:px-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => editor?.chain().focus().undo().run()}
                                    disabled={!editor?.can().undo()}
                                >
                                    <Undo className="h-4 w-4" />
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => editor?.chain().focus().redo().run()}
                                    disabled={!editor?.can().redo()}
                                >
                                    <Redo className="h-4 w-4" />
                                </Button>

                                <div className="mx-1 h-6 w-px bg-border" />

                                <Button
                                    type="button"
                                    variant={editor?.isActive("bold") ? "default" : "ghost"}
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => editor?.chain().focus().toggleBold().run()}
                                >
                                    <Bold className="h-4 w-4" />
                                </Button>

                                <Button
                                    type="button"
                                    variant={editor?.isActive("italic") ? "default" : "ghost"}
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                                >
                                    <Italic className="h-4 w-4" />
                                </Button>

                                <Button
                                    type="button"
                                    variant={
                                        editor?.isActive("underline") ? "default" : "ghost"
                                    }
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() =>
                                        editor?.chain().focus().toggleUnderline().run()
                                    }
                                >
                                    <UnderlineIcon className="h-4 w-4" />
                                </Button>

                                <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

                                <Button
                                    type="button"
                                    variant={
                                        editor?.isActive("heading", { level: 2 })
                                            ? "default"
                                            : "ghost"
                                    }
                                    size="sm"
                                    className="h-8 gap-2 px-2"
                                    onClick={() =>
                                        editor
                                            ?.chain()
                                            .focus()
                                            .toggleHeading({ level: 2 })
                                            .run()
                                    }
                                >
                                    <Heading2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">Заголовок</span>
                                </Button>

                                <Button
                                    type="button"
                                    variant={
                                        editor?.isActive("bulletList") ? "default" : "ghost"
                                    }
                                    size="sm"
                                    className="h-8 gap-2 px-2"
                                    onClick={() =>
                                        editor?.chain().focus().toggleBulletList().run()
                                    }
                                >
                                    <List className="h-4 w-4" />
                                    <span className="hidden sm:inline">Список</span>
                                </Button>

                                <Button
                                    type="button"
                                    variant={
                                        editor?.isActive("orderedList") ? "default" : "ghost"
                                    }
                                    size="sm"
                                    className="h-8 gap-2 px-2"
                                    onClick={() =>
                                        editor?.chain().focus().toggleOrderedList().run()
                                    }
                                >
                                    <ListOrdered className="h-4 w-4" />
                                    <span className="hidden sm:inline">Нумерація</span>
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-2 px-2"
                                    onClick={() =>
                                        editor?.chain().focus().setHorizontalRule().run()
                                    }
                                >
                                    <Minus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Лінія</span>
                                </Button>
                            </div>

                            <div className="grid min-w-0 gap-2 border-b bg-muted/10 px-2 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-3 sm:py-3">
                                <Input
                                    value={fieldLabel}
                                    onChange={(e) => setFieldLabel(e.target.value)}
                                    placeholder="Поле: ПІБ працівника"
                                    className="h-9 min-w-0"
                                />

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-9 gap-2"
                                    onClick={() => {
                                        const label =
                                            fieldLabel.trim() || "Поле для заповнення";

                                        editor
                                            ?.chain()
                                            .focus()
                                            .insertContent([
                                                {
                                                    type: "reportField",
                                                    attrs: {
                                                        id: `${Date.now()}`,
                                                        label,
                                                    },
                                                },
                                                {
                                                    type: "text",
                                                    text: " ",
                                                },
                                            ])
                                            .run();

                                        setFieldLabel("");
                                    }}
                                >
                                    <SquarePen className="h-4 w-4" />
                                    Додати поле
                                </Button>
                            </div>

                            <div className="min-w-0 max-w-full overflow-hidden break-words">
                                <EditorContent editor={editor} />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                        onClick={() =>
                            router.push("/dashboard/manager/reports/templates")
                        }
                    >
                        Скасувати
                    </Button>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full gap-2 sm:w-auto"
                    >
                        <Save className="h-4 w-4" />
                        {isLoading
                            ? "Збереження..."
                            : mode === "edit"
                                ? "Зберегти"
                                : "Створити"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
