"use client";

import React, { useState } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

import SchoolPicker from "@/components/manager/student/card/SchoolPicker";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import { CITY_OPTIONS } from "@/components/landing/contact-form";
import {
  formatApiError,
  validateRequiredFields,
  type FieldErrors,
} from "@/libs/form-validation";
import type { UserFormData } from "@/store/users/user.type";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPhone = (code: string, number: string) =>
  /^\+\d{1,4}$/.test(code) && /^\d{6,15}$/.test(number);

const isValidBirthDate = (date: string) => {
  if (!date) return false;

  const birth = new Date(date);
  const today = new Date();
  if (birth > today) return false;

  const age =
    today.getFullYear() -
    birth.getFullYear() -
    (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);

  return age >= 18;
};

interface Props {
  value: UserFormData;
  onChange: (value: UserFormData) => void;
  onSubmit: () => Promise<void> | void;
  submitLabel: string;
  loading?: boolean;
}

type FormErrors = FieldErrors<
  "full_name" | "email" | "phone" | "date_of_birth" | "city" | "school_ids" | "api"
>;

export function Form({ value, onChange, onSubmit, submitLabel, loading }: Props) {
  const [errors, setErrors] = useState<FormErrors>({});

  const clearError = (key: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [key]: undefined, api: undefined }));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const key = event.target.name as keyof UserFormData;
    onChange({ ...value, [key]: event.target.value });
    clearError(key as keyof FormErrors);
  };

  const handlePhoneChange = (phone: string, meta: any) => {
    const dialCode = meta.country?.dialCode ?? "380";

    onChange({
      ...value,
      phone_country_code: `+${dialCode}`,
      phone_national_number: phone.replace(`+${dialCode}`, "").replace(/[^\d]/g, ""),
    });

    clearError("phone");
  };

  const setSchools = (next: number[] | number | null | undefined) => {
    const school_ids = Array.isArray(next) ? next : typeof next === "number" ? [next] : [];
    onChange({ ...value, school_ids });
    clearError("school_ids");
  };

  const validate = () => {
    const nextErrors: FormErrors = validateRequiredFields([
      { key: "full_name", label: "ПІБ", value: value.full_name },
      { key: "email", label: "Email", value: value.email },
      { key: "date_of_birth", label: "Дата народження", value: value.date_of_birth },
      { key: "city", label: "Місто", value: value.city },
      { key: "school_ids", label: "Школи", value: value.school_ids },
    ]);

    if (value.email && !isValidEmail(value.email)) {
      nextErrors.email = "Вкажіть коректну електронну пошту.";
    }

    if (!isValidPhone(value.phone_country_code, value.phone_national_number)) {
      nextErrors.phone = "Вкажіть коректний номер телефону.";
    }

    if (value.date_of_birth && !isValidBirthDate(value.date_of_birth)) {
      nextErrors.date_of_birth = "Користувачу має бути 18 або більше років.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onSubmit();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        api: formatApiError(error, "Не вдалося зберегти користувача."),
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
        <RequiredLabel required>ПІБ</RequiredLabel>
        <Input
          name="full_name"
          value={value.full_name}
          placeholder="Ім'я та прізвище"
          onChange={handleChange}
          aria-invalid={!!errors.full_name}
        />
        {errors.full_name ? <p className="text-sm text-destructive">{errors.full_name}</p> : null}
      </div>

      <div className="space-y-2" data-field-root>
        <RequiredLabel required>Email</RequiredLabel>
        <Input
          name="email"
          type="email"
          placeholder="user@example.com"
          value={value.email}
          onChange={handleChange}
          aria-invalid={!!errors.email}
        />
        {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
      </div>

      <div className="space-y-2" data-field-root>
        <RequiredLabel required>Дата народження</RequiredLabel>
        <Input
          name="date_of_birth"
          type="date"
          value={value.date_of_birth}
          onChange={handleChange}
          aria-invalid={!!errors.date_of_birth}
        />
        {errors.date_of_birth ? (
          <p className="text-sm text-destructive">{errors.date_of_birth}</p>
        ) : null}
      </div>

      <div className="space-y-2" data-field-root>
        <RequiredLabel required>Телефон</RequiredLabel>
        <PhoneInput
          defaultCountry="ua"
          value={`${value.phone_country_code}${value.phone_national_number}`}
          onChange={handlePhoneChange}
          inputClassName={`w-full ${errors.phone ? "border border-destructive" : ""}`}
        />
        {errors.phone ? <p className="text-sm text-destructive">{errors.phone}</p> : null}
      </div>

      <div className="space-y-2" data-field-root>
        <CityCombobox
          value={value.city ?? ""}
          onChange={(city) => {
            onChange({ ...value, city });
            clearError("city");
          }}
          options={CITY_OPTIONS}
          required
          label="Місто *"
          placeholder="Наприклад: Ужгород"
        />
        {errors.city ? <p className="text-sm text-destructive">{errors.city}</p> : null}
      </div>

      <div className="space-y-2" data-field-root>
        <RequiredLabel required>Школи</RequiredLabel>
        <SchoolPicker value={value.school_ids ?? []} onChange={setSchools} />
        {errors.school_ids ? <p className="text-sm text-destructive">{errors.school_ids}</p> : null}
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={loading}>
        {loading ? "Збереження..." : submitLabel}
      </Button>
    </div>
  );
}
