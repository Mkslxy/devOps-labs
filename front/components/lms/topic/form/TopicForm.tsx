import React, { useEffect, useState } from "react";

import ModulePicker from "@/components/lms/topic/card/ModulePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import { Textarea } from "@/components/ui/textarea";
import { formatApiError, validateRequiredFields, type FieldErrors } from "@/libs/form-validation";
import type { Topic, TopicPayload } from "@/store/topic/topic.type";

type Props = {
  initial?: Topic;
  onSubmit: (payload: TopicPayload) => Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  loading?: boolean;
};

type TopicFormErrors = FieldErrors<"title" | "module" | "api">;

export default function TopicForm({ initial, onSubmit, onCancel, submitText, loading }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [contentDescription, setContentDescription] = useState(initial?.content_description ?? "");
  const [moduleId, setModuleId] = useState<number | null>(initial?.module ?? null);
  const [errors, setErrors] = useState<TopicFormErrors>({});

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setContentDescription(initial?.content_description ?? "");
    setModuleId(initial?.module ?? null);
    setErrors({});
  }, [initial]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: TopicFormErrors = validateRequiredFields([
      { key: "title", label: "Назва", value: title },
      { key: "module", label: "Модуль", value: moduleId },
    ]);

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await onSubmit({
        title: title.trim(),
        content_description: contentDescription,
        module: moduleId!,
      });
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        api: formatApiError(error, "Не вдалося зберегти тему."),
      }));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" onClick={(event) => event.stopPropagation()}>
      {errors.api ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {errors.api}
        </div>
      ) : null}

      <div className="space-y-2" data-field-root>
        <RequiredLabel required>Назва</RequiredLabel>
        <Input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setErrors((previous) => ({ ...previous, title: undefined, api: undefined }));
          }}
          aria-invalid={!!errors.title}
          placeholder="Напр. Present Simple"
        />
        {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
      </div>

      <div className="space-y-2">
        <RequiredLabel>Опис</RequiredLabel>
        <Textarea
          value={contentDescription}
          onChange={(event) => setContentDescription(event.target.value)}
          placeholder="Короткий опис теми"
        />
      </div>

      <div className="space-y-2" data-field-root>
        <RequiredLabel required>Модуль</RequiredLabel>
        <div className={errors.module ? "rounded-xl border border-destructive p-2" : ""}>
          <ModulePicker
            value={moduleId}
            onChange={(value) => {
              setModuleId(value);
              setErrors((previous) => ({ ...previous, module: undefined, api: undefined }));
            }}
          />
        </div>
        {errors.module ? <p className="text-sm text-destructive">{errors.module}</p> : null}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Скасувати
          </Button>
        ) : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Збереження..." : submitText ?? (initial ? "Зберегти" : "Створити")}
        </Button>
      </div>
    </form>
  );
}
