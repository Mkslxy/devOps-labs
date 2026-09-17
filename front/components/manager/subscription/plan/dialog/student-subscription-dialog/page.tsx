"use client";

import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatApiError, validateRequiredFields, type FieldErrors } from "@/libs/form-validation";
import { useGetGroupsQuery } from "@/store/groups/group.api";
import { useGetSubscriptionPlansQuery } from "@/store/subscription/subscription-plan.api";
import { STUDENT_SUBSCRIPTION_STATUS_LABELS } from "@/store/subscription/student-subscription.label";
import {
  useCreateStudentSubscriptionMutation,
  useUpdateStudentSubscriptionMutation,
} from "@/store/subscription/student-subscription.api";
import {
  StudentSubscriptionStatusEnum,
  type StudentSubscription,
  type StudentSubscriptionPayload,
} from "@/store/subscription/student-subscription.type";
import { useGetUsersQuery } from "@/store/users/user.api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: StudentSubscription | null;
}

type FormErrors = FieldErrors<"student_id" | "plan_id" | "group_id" | "lessons_remaining" | "api">;

export function StudentSubscriptionDialog({ open, onOpenChange, subscription }: Props) {
  const [form, setForm] = useState({
    student_id: 0,
    lessons_remaining: "",
    plan_id: 0,
    group_id: 0,
    status: StudentSubscriptionStatusEnum.pending_assignment,
    start_date: "",
    end_date: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: students } = useGetUsersQuery({
    page: 1,
    page_size: 50,
    role_slug: "student",
  } as any);

  const { data: groups } = useGetGroupsQuery({
    page: 1,
    page_size: 50,
  } as any);

  const { data: plans } = useGetSubscriptionPlansQuery({
    page: 1,
    is_active: true,
  });

  const [createStudentSubscription, { isLoading: isCreating }] =
    useCreateStudentSubscriptionMutation();
  const [updateStudentSubscription, { isLoading: isUpdating }] =
    useUpdateStudentSubscriptionMutation();

  useEffect(() => {
    if (!open) return;

    if (subscription) {
      setForm({
        student_id: subscription.student?.id || 0,
        lessons_remaining: String(subscription.lessons_remaining ?? ""),
        plan_id: subscription.plan?.id || 0,
        group_id: subscription.group?.id || 0,
        status: subscription.status || StudentSubscriptionStatusEnum.pending_assignment,
        start_date: subscription.start_date || "",
        end_date: subscription.end_date || "",
      });
    } else {
      setForm({
        student_id: 0,
        lessons_remaining: "",
        plan_id: 0,
        group_id: 0,
        status: StudentSubscriptionStatusEnum.pending_assignment,
        start_date: "",
        end_date: "",
      });
    }

    setErrors({});
  }, [open, subscription]);

  const isPendingAssignment = form.status === StudentSubscriptionStatusEnum.pending_assignment;

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined, api: undefined }));
  };

  const validate = () => {
    const nextErrors: FormErrors = validateRequiredFields([
      { key: "student_id", label: "Студент", value: form.student_id },
      { key: "plan_id", label: "План", value: form.plan_id },
      { key: "group_id", label: "Група", value: form.group_id },
    ]);

    if (form.lessons_remaining && Number(form.lessons_remaining) < 0) {
      nextErrors.lessons_remaining = "Залишок уроків не може бути меншим за 0.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: StudentSubscriptionPayload = {
      student_id: form.student_id,
      lessons_remaining: form.lessons_remaining ? Number(form.lessons_remaining) : undefined,
      plan_id: form.plan_id,
      group_id: form.group_id,
      status: form.status,
      start_date: form.start_date || undefined,
      end_date: isPendingAssignment ? undefined : form.end_date || undefined,
    };

    try {
      setErrors({});

      if (subscription) {
        await updateStudentSubscription({
          id: subscription.id,
          data: payload,
        }).unwrap();
      } else {
        await createStudentSubscription(payload).unwrap();
      }

      onOpenChange(false);
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        api: formatApiError(error, "Не вдалося зберегти абонемент студента."),
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {subscription ? "Редагувати прив'язку абонемента" : "Призначити абонемент студенту"}
          </DialogTitle>
        </DialogHeader>

        {errors.api ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errors.api}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2" data-field-root>
              <RequiredLabel required>Студент</RequiredLabel>
              <Select
                value={form.student_id ? String(form.student_id) : ""}
                onValueChange={(value) => updateField("student_id", Number(value))}
              >
                <SelectTrigger aria-invalid={!!errors.student_id}>
                  <SelectValue placeholder="Оберіть студента" />
                </SelectTrigger>
                <SelectContent>
                  {(students?.results ?? []).map((student: any) => (
                    <SelectItem key={student.id} value={String(student.id)}>
                      {student.full_name || student.email || "Немає"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.student_id ? <p className="text-sm text-destructive">{errors.student_id}</p> : null}
            </div>

            <div className="space-y-2" data-field-root>
              <RequiredLabel required>План</RequiredLabel>
              <Select
                value={form.plan_id ? String(form.plan_id) : ""}
                onValueChange={(value) => {
                  const selectedPlan = (plans?.results ?? []).find((plan) => plan.id === Number(value));
                  setForm((previous) => ({
                    ...previous,
                    plan_id: Number(value),
                    lessons_remaining:
                      !subscription && selectedPlan?.lessons_count
                        ? String(selectedPlan.lessons_count)
                        : previous.lessons_remaining,
                  }));
                  setErrors((previous) => ({ ...previous, plan_id: undefined, api: undefined }));
                }}
              >
                <SelectTrigger aria-invalid={!!errors.plan_id}>
                  <SelectValue placeholder="Оберіть план" />
                </SelectTrigger>
                <SelectContent>
                  {(plans?.results ?? []).map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {plan.name || "Немає"} · {plan.lessons_count} уроків · {plan.price}{" "}
                      {plan.currency?.symbol || plan.currency?.code || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.plan_id ? <p className="text-sm text-destructive">{errors.plan_id}</p> : null}
            </div>

            <div className="space-y-2" data-field-root>
              <RequiredLabel required>Група</RequiredLabel>
              <Select
                value={form.group_id ? String(form.group_id) : ""}
                onValueChange={(value) => updateField("group_id", Number(value))}
              >
                <SelectTrigger aria-invalid={!!errors.group_id}>
                  <SelectValue placeholder="Оберіть групу" />
                </SelectTrigger>
                <SelectContent>
                  {(groups?.results ?? []).map((group: any) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.name || "Немає"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.group_id ? <p className="text-sm text-destructive">{errors.group_id}</p> : null}
            </div>

            <div className="space-y-2" data-field-root>
              <RequiredLabel>Залишок уроків</RequiredLabel>
              <Input
                type="number"
                min={0}
                value={form.lessons_remaining}
                onChange={(event) => updateField("lessons_remaining", event.target.value)}
                placeholder="Автоматично з плану"
                aria-invalid={!!errors.lessons_remaining}
              />
              {errors.lessons_remaining ? (
                <p className="text-sm text-destructive">{errors.lessons_remaining}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <RequiredLabel>Статус</RequiredLabel>
              <Select
                value={form.status}
                onValueChange={(value) => {
                  const nextStatus = value as StudentSubscriptionStatusEnum;
                  setForm((previous) => ({
                    ...previous,
                    status: nextStatus,
                    end_date:
                      nextStatus === StudentSubscriptionStatusEnum.pending_assignment
                        ? ""
                        : previous.end_date,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть статус" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(StudentSubscriptionStatusEnum).map((status) => (
                    <SelectItem key={status} value={status}>
                      {STUDENT_SUBSCRIPTION_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <RequiredLabel>Дата початку</RequiredLabel>
              <Input
                type="date"
                value={form.start_date}
                onChange={(event) => updateField("start_date", event.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <RequiredLabel>Дата завершення</RequiredLabel>
              <Input
                type="date"
                value={isPendingAssignment ? "" : form.end_date}
                disabled={isPendingAssignment}
                onChange={(event) => updateField("end_date", event.target.value)}
              />
              {isPendingAssignment ? (
                <p className="text-xs text-muted-foreground">
                  Дата завершення буде розрахована автоматично після активації.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Скасувати
            </Button>

            <Button type="submit" disabled={isCreating || isUpdating}>
              {subscription ? "Зберегти" : "Призначити"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
