"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import CoursePicker from "@/components/lms/courses/card/CoursePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import { formatApiError, validateRequiredFields, type FieldErrors } from "@/libs/form-validation";
import type { Module, ModulePayload } from "@/store/module/module.type";

interface Props {
  initial?: Module;
  onSubmit: (payload: ModulePayload) => Promise<void>;
  onCancel?: () => void;
  submitText?: string;
}

type ModuleFormErrors = FieldErrors<"title" | "course" | "api">;

export default function ModuleForm({ initial, onSubmit, onCancel, submitText }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [courseId, setCourseId] = useState<number | null>(initial?.course ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ModuleFormErrors>({});

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setCourseId(initial?.course ?? null);
    setErrors({});
  }, [initial]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const nextErrors: ModuleFormErrors = validateRequiredFields([
      { key: "title", label: "Назва", value: title },
      { key: "course", label: "Курс", value: courseId },
    ]);

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), course: courseId! });
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        api: formatApiError(error, "Не вдалося зберегти модуль."),
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" onClick={(event) => event.stopPropagation()}>
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
          placeholder="Наприклад: Module 1"
          aria-invalid={!!errors.title}
        />
        {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
      </div>

      <div className="space-y-2" data-field-root>
        <div className="space-y-1">
          <RequiredLabel required>Курс</RequiredLabel>
          <p className="text-xs text-muted-foreground">Оберіть курс для модуля.</p>
        </div>
        <div className={errors.course ? "rounded-xl border border-destructive p-2" : ""}>
          <CoursePicker
            value={courseId}
            onChange={(value) => {
              setCourseId(value);
              setErrors((previous) => ({ ...previous, course: undefined, api: undefined }));
            }}
          />
        </div>
        {errors.course ? <p className="text-sm text-destructive">{errors.course}</p> : null}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Скасувати
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Збереження..." : submitText ?? (initial ? "Зберегти" : "Створити")}
        </Button>
      </div>
    </form>
  );
}
