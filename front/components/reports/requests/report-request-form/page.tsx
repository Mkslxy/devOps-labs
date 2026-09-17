"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { useCreateReportRequestMutation } from "@/store/reports/report-request.api";
import { useGetReportTemplatesQuery } from "@/store/reports/report-template.api";
import type { ReportTemplate } from "@/store/reports/report-template.type";
import { useGetUsersQuery } from "@/store/users/user.api";

type FormErrors = FieldErrors<"templateId" | "assignedToId" | "deadline" | "api">;

export function ReportRequestForm() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: templatesData, isLoading: isTemplatesLoading } = useGetReportTemplatesQuery({
    page: 1,
    page_size: 50,
    is_active: true,
    ordering: "-id",
  });

  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery({
    page: 1,
    page_size: 50,
  });

  const [createReportRequest, { isLoading: isCreating }] = useCreateReportRequestMutation();
  const templates: ReportTemplate[] = templatesData?.results || [];
  const users = usersData?.results || [];

  const validate = () => {
    const nextErrors: FormErrors = validateRequiredFields([
      { key: "templateId", label: "Шаблон", value: templateId },
      { key: "assignedToId", label: "Працівник", value: assignedToId },
      { key: "deadline", label: "Дедлайн", value: deadline },
    ]);

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setErrors({});
      await createReportRequest({
        template_id: Number(templateId),
        assigned_to_id: Number(assignedToId),
        deadline: new Date(deadline).toISOString(),
      }).unwrap();

      router.push("/dashboard/manager/reports/requests");
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        api: formatApiError(error, "Не вдалося створити запит на звіт."),
      }));
    }
  };

  return (
    <div className="space-y-6 px-3 pb-6 sm:px-4">
      <div className="flex items-start justify-between gap-3 border-b pb-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-bold leading-tight sm:text-2xl">Призначити звіт</h1>
          <p className="text-sm text-muted-foreground">
            Оберіть шаблон, працівника та дедлайн.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          onClick={() => router.push("/dashboard/manager/reports/requests")}
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="space-y-4 p-4">
          {errors.api ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {errors.api}
            </div>
          ) : null}

          <div className="space-y-2" data-field-root>
            <RequiredLabel required>Шаблон</RequiredLabel>
            <Select
              value={templateId}
              onValueChange={(value) => {
                setTemplateId(value);
                setErrors((previous) => ({ ...previous, templateId: undefined, api: undefined }));
              }}
              disabled={isTemplatesLoading || isCreating}
            >
              <SelectTrigger aria-invalid={!!errors.templateId}>
                <SelectValue placeholder="Оберіть шаблон" />
              </SelectTrigger>

              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={String(template.id)}>
                    {template.title || "Немає"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.templateId ? <p className="text-sm text-destructive">{errors.templateId}</p> : null}
          </div>

          <div className="space-y-2" data-field-root>
            <RequiredLabel required>Працівник</RequiredLabel>
            <Select
              value={assignedToId}
              onValueChange={(value) => {
                setAssignedToId(value);
                setErrors((previous) => ({ ...previous, assignedToId: undefined, api: undefined }));
              }}
              disabled={isUsersLoading || isCreating}
            >
              <SelectTrigger aria-invalid={!!errors.assignedToId}>
                <SelectValue placeholder="Оберіть працівника" />
              </SelectTrigger>

              <SelectContent>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.full_name || user.email || `Користувач #${user.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assignedToId ? <p className="text-sm text-destructive">{errors.assignedToId}</p> : null}
          </div>

          <div className="space-y-2" data-field-root>
            <RequiredLabel required>Дедлайн</RequiredLabel>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(event) => {
                setDeadline(event.target.value);
                setErrors((previous) => ({ ...previous, deadline: undefined, api: undefined }));
              }}
              disabled={isCreating}
              aria-invalid={!!errors.deadline}
            />
            {errors.deadline ? <p className="text-sm text-destructive">{errors.deadline}</p> : null}
          </div>
        </Card>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isCreating}
            className="w-full sm:w-auto"
            onClick={() => router.push("/dashboard/manager/reports/requests")}
          >
            Скасувати
          </Button>

          <Button type="submit" disabled={isCreating} className="w-full gap-2 sm:w-auto">
            <Save className="h-4 w-4" />
            {isCreating ? "Створення..." : "Створити"}
          </Button>
        </div>
      </form>
    </div>
  );
}
