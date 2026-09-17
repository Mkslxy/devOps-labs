import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { formatApiError } from "@/libs/form-validation";
import type { TestVersionUpdatePayload } from "@/store/test-management/test-management.type";

type VersionLike = {
  id: number;
  time_limit_minutes?: number | null;
  passing_score_percent?: number | null;
  is_random_order?: boolean | null;
};

type FormValues = Pick<
  TestVersionUpdatePayload,
  "time_limit_minutes" | "passing_score_percent" | "is_random_order"
>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: VersionLike | null;
  onSubmit: (id: number, data: Partial<TestVersionUpdatePayload>) => Promise<void> | void;
  loading?: boolean;
};

export function EditTestVersionDialog({ open, onOpenChange, version, onSubmit, loading }: Props) {
  const [apiError, setApiError] = useState("");
  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<FormValues>({
    defaultValues: {
      time_limit_minutes: 0,
      passing_score_percent: 0,
      is_random_order: false,
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    reset({
      time_limit_minutes: version?.time_limit_minutes ?? 0,
      passing_score_percent: version?.passing_score_percent ?? 0,
      is_random_order: !!version?.is_random_order,
    });
    setApiError("");
  }, [version, reset]);

  const submit = async (values: FormValues) => {
    if (!version) return;

    try {
      setApiError("");
      await onSubmit(version.id, {
        time_limit_minutes: Number(values.time_limit_minutes),
        passing_score_percent: Number(values.passing_score_percent),
        is_random_order: !!values.is_random_order,
      });
      onOpenChange(false);
    } catch (error) {
      setApiError(formatApiError(error, "Не вдалося зберегти версію тесту."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редагувати версію #{version?.id ?? ""}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="grid gap-4">
          {apiError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {apiError}
            </div>
          ) : null}

          <div className="grid gap-2" data-field-root>
            <RequiredLabel required>Ліміт часу (хв)</RequiredLabel>
            <Input
              type="number"
              placeholder="Напр. 30"
              aria-invalid={!!formState.errors.time_limit_minutes}
              {...register("time_limit_minutes", {
                valueAsNumber: true,
                required: "Заповніть поле \"Ліміт часу\".",
                min: { value: 0, message: "Не може бути менше 0." },
              })}
            />
            {formState.errors.time_limit_minutes?.message ? (
              <p className="text-xs text-destructive">{formState.errors.time_limit_minutes.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2" data-field-root>
            <RequiredLabel required>Прохідний %</RequiredLabel>
            <Input
              type="number"
              placeholder="Напр. 70"
              aria-invalid={!!formState.errors.passing_score_percent}
              {...register("passing_score_percent", {
                valueAsNumber: true,
                required: "Заповніть поле \"Прохідний %\".",
                min: { value: 0, message: "Мінімум 0." },
                max: { value: 100, message: "Максимум 100." },
              })}
            />
            {formState.errors.passing_score_percent?.message ? (
              <p className="text-xs text-destructive">{formState.errors.passing_score_percent.message}</p>
            ) : null}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="grid gap-1">
              <RequiredLabel>Випадковий порядок</RequiredLabel>
              <p className="text-xs text-muted-foreground">Перемішувати питання</p>
            </div>

            <Switch
              checked={!!watch("is_random_order")}
              onCheckedChange={(value) => setValue("is_random_order", value, { shouldDirty: true })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={!!loading}>
              Скасувати
            </Button>
            <Button type="submit" disabled={!!loading || !formState.isDirty || !version}>
              Зберегти
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
