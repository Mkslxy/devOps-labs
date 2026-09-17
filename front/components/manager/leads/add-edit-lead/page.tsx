"use client";

import React, { useEffect, useState } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

import { CITY_OPTIONS } from "@/components/landing/contact-form";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatApiError, validateRequiredFields, type FieldErrors } from "@/libs/form-validation";
import { useCreateLeadMutation, useUpdateLeadMutation } from "@/store/leads/lead.api";
import { LeadStatusEnum, type Lead, type LeadPayload } from "@/store/leads/lead.type";

function firstString(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" && first.trim() ? first : null;
  }
  if (typeof value === "string" && value.trim()) return value;
  return null;
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

type LeadFormErrors = FieldErrors<"name" | "email" | "api">;

export function LeadUpsertDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: Lead | null;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();
  const isLoading = isCreating || isUpdating;

  const [form, setForm] = useState({
    name: initial?.name || "",
    email: initial?.email || "",
    city: initial?.city || "",
    source: initial?.source || "website",
    status: (firstString(initial?.status) ?? "new") as LeadStatusEnum,
    notes: initial?.notes || "",
  });
  const [phoneE164, setPhoneE164] = useState(initial?.phone || "");
  const [errors, setErrors] = useState<LeadFormErrors>({});

  useEffect(() => {
    setForm({
      name: initial?.name || "",
      email: initial?.email || "",
      city: initial?.city || "",
      source: initial?.source || "website",
      status: (firstString(initial?.status) ?? "new") as LeadStatusEnum,
      notes: initial?.notes || "",
    });
    setPhoneE164(initial?.phone || "");
    setErrors({});
  }, [initial, open]);

  const title = initial ? "Редагувати лід" : "Додати лід";

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined, api: undefined }));
  };

  const validate = () => {
    const nextErrors: LeadFormErrors = validateRequiredFields([
      { key: "name", label: "Ім'я", value: form.name },
    ]);

    if (form.email.trim() && !isValidEmail(form.email.trim())) {
      nextErrors.email = "Вкажіть коректну електронну пошту.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload: LeadPayload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: phoneE164.trim() || undefined,
      source: form.source.trim() || "website",
      status: [form.status],
      notes: form.notes.trim() || undefined,
      city: form.city.trim() || undefined,
    };

    try {
      if (initial) {
        await updateLead({ id: initial.id, data: payload }).unwrap();
      } else {
        await createLead(payload).unwrap();
      }
      toast({ title: "Збережено" });
      setOpen(false);
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        api: formatApiError(error, "Не вдалося зберегти лід."),
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {errors.api ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errors.api}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2" data-field-root>
            <RequiredLabel required>Ім'я</RequiredLabel>
            <Input
              placeholder="Вкажіть ім'я"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              aria-invalid={!!errors.name}
            />
            {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <RequiredLabel>Статус</RequiredLabel>
            <Select value={form.status} onValueChange={(value) => updateField("status", value as LeadStatusEnum)}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LeadStatusEnum.new}>Новий</SelectItem>
                <SelectItem value={LeadStatusEnum.processing}>В прогресі</SelectItem>
                <SelectItem value={LeadStatusEnum.converted}>Конвертований</SelectItem>
                <SelectItem value={LeadStatusEnum.rejected}>Відмовлено</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2" data-field-root>
            <RequiredLabel>Email</RequiredLabel>
            <Input
              placeholder="Вкажіть пошту"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
          </div>

          <div className="space-y-2">
            <RequiredLabel>Телефон</RequiredLabel>
            <PhoneInput
              defaultCountry="ua"
              value={phoneE164}
              onChange={(phone) => setPhoneE164(phone)}
              inputProps={{ placeholder: "+380 XX XXX XX XX" }}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <CityCombobox
              value={form.city}
              onChange={(value) => updateField("city", value)}
              options={CITY_OPTIONS}
              label="Місто"
              placeholder="Наприклад: Ужгород"
            />
          </div>

          <div className="space-y-2">
            <RequiredLabel>Джерело</RequiredLabel>
            <Input
              placeholder="Вкажіть джерело"
              value={form.source}
              onChange={(event) => updateField("source", event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <RequiredLabel>Нотатки</RequiredLabel>
          <Textarea
            placeholder="Вкажіть нотатки до ліда"
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={4}
            className="min-h-[120px]"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Скасувати
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Зберігаємо..." : "Зберегти"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
