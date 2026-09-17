"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatApiError, validateRequiredFields, type FieldErrors } from "@/libs/form-validation";
import type { CoursePayload } from "@/store/groups/group.type";
import { useGetSubjectsQuery } from "@/store/subject/subject.api";

interface Props {
  value: CoursePayload;
  onChange: (value: CoursePayload) => void;
  onSubmit: () => Promise<void> | void;
  submitLabel: string;
  loading?: boolean;
  onCancel?: () => void;
}

type CourseFormErrors = FieldErrors<"title" | "price" | "level" | "subject_id" | "api">;

export function CourseForm({ value, onChange, onSubmit, submitLabel, onCancel, loading }: Props) {
  const [errors, setErrors] = React.useState<CourseFormErrors>({});
  const { data: subjectsData, isLoading: subjectsLoading } = useGetSubjectsQuery({
    page: 1,
    page_size: 100,
  });
  const subjects = subjectsData?.results ?? [];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setErrors((previous) => ({ ...previous, [event.target.name]: undefined, api: undefined }));
    onChange({
      ...value,
      [event.target.name]: event.target.value,
    });
  };

  const submit = async () => {
    const nextErrors: CourseFormErrors = validateRequiredFields([
      { key: "title", label: "Назва курсу", value: value.title },
      { key: "subject_id", label: "Предмет", value: value.subject_id },
      { key: "price", label: "Ціна", value: value.price },
      { key: "level", label: "Рівень", value: value.level },
    ]);

    if (value.price && Number(value.price) < 0) {
      nextErrors.price = "Ціна не може бути від'ємною.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await onSubmit();
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        api: formatApiError(error, "Не вдалося зберегти курс."),
      }));
    }
  };

  return (
    <div className="space-y-4">
      {errors.api ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {errors.api}
        </div>
      ) : null}

      <div className="space-y-2" data-field-root>
        <RequiredLabel required>Назва курсу</RequiredLabel>
        <Input
          name="title"
          value={value.title}
          placeholder="Мова з нуля"
          onChange={handleChange}
          aria-invalid={!!errors.title}
        />
        {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
      </div>

      <div className="space-y-2">
        <RequiredLabel>Опис</RequiredLabel>
        <Textarea
          name="description"
          value={value.description}
          placeholder="Короткий опис курсу"
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2" data-field-root>
        <RequiredLabel required>Предмет</RequiredLabel>
        <Select
          value={value.subject_id ? String(value.subject_id) : ""}
          onValueChange={(subjectId) => {
            setErrors((previous) => ({ ...previous, subject_id: undefined, api: undefined }));
            onChange({ ...value, subject_id: Number(subjectId) });
          }}
          disabled={subjectsLoading}
        >
          <SelectTrigger aria-invalid={!!errors.subject_id}>
            <SelectValue placeholder={subjectsLoading ? "Завантаження..." : "Оберіть предмет"} />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={String(subject.id)}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.subject_id ? <p className="text-sm text-destructive">{errors.subject_id}</p> : null}
      </div>

      <div className="space-y-2" data-field-root>
        <RequiredLabel required>Ціна</RequiredLabel>
        <Input
          name="price"
          type="number"
          min={0}
          value={value.price}
          onChange={handleChange}
          aria-invalid={!!errors.price}
        />
        {errors.price ? <p className="text-sm text-destructive">{errors.price}</p> : null}
      </div>

      <div className="space-y-2" data-field-root>
        <RequiredLabel required>Рівень</RequiredLabel>
        <Input
          name="level"
          value={value.level}
          placeholder="Beginner / Intermediate"
          onChange={handleChange}
          aria-invalid={!!errors.level}
        />
        {errors.level ? <p className="text-sm text-destructive">{errors.level}</p> : null}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={value.is_active}
          onCheckedChange={(checked) => onChange({ ...value, is_active: Boolean(checked) })}
        />
        <RequiredLabel>Активний курс</RequiredLabel>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Скасувати
          </Button>
        ) : null}

        <Button type="button" onClick={submit} disabled={loading}>
          {loading ? "Збереження..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
