"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatApiError, validateRequiredFields, type FieldErrors } from "@/libs/form-validation";
import { useGetCoursesQuery } from "@/store/groups/group.api";
import { useGetLessonTypesQuery } from "@/store/lessons/lesson.api";
import { useGetPnlCurrenciesQuery } from "@/store/pnl/pnl.api";
import { useCreateSubscriptionPlanMutation } from "@/store/subscription/subscription-plan.api";
import type { SubscriptionPlanPayload } from "@/store/subscription/subscription-plan.type";

type FormState = {
  name: string;
  description: string;
  lessons_count: string;
  duration_days: string;
  grace_period_days: string;
  price: string;
  price_per_lesson: string;
  currency_id: string;
  course_id: string;
  lesson_type: string;
  is_active: boolean;
};

type FormErrors = FieldErrors<
  "name" | "lessons_count" | "duration_days" | "price" | "price_per_lesson" | "currency_id" | "api"
>;

const defaultForm: FormState = {
  name: "",
  description: "",
  lessons_count: "",
  duration_days: "",
  grace_period_days: "",
  price: "",
  price_per_lesson: "",
  currency_id: "",
  course_id: "",
  lesson_type: "",
  is_active: true,
};

export default function AddSubscriptionPlanPage() {
  const router = useRouter();
  const [createSubscriptionPlan, { isLoading }] = useCreateSubscriptionPlanMutation();

  const { data: coursesData, isLoading: isCoursesLoading } = useGetCoursesQuery({ page: 1 });
  const { data: currenciesData, isLoading: isCurrenciesLoading } = useGetPnlCurrenciesQuery({ page: 1 });
  const { data: lessonTypesData, isLoading: isLessonTypesLoading } = useGetLessonTypesQuery();

  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined, api: undefined }));
  };

  const validate = () => {
    const nextErrors: FormErrors = validateRequiredFields([
      { key: "name", label: "Назва", value: form.name },
      { key: "lessons_count", label: "Кількість уроків", value: form.lessons_count },
      { key: "duration_days", label: "Тривалість у днях", value: form.duration_days },
      { key: "price", label: "Ціна", value: form.price },
      { key: "currency_id", label: "Валюта", value: form.currency_id },
    ]);

    if (form.lessons_count && Number(form.lessons_count) < 1) {
      nextErrors.lessons_count = "Кількість уроків має бути більшою за 0.";
    }

    if (form.duration_days && Number(form.duration_days) < 1) {
      nextErrors.duration_days = "Тривалість має бути більшою за 0.";
    }

    if (form.price && Number(form.price) < 0) {
      nextErrors.price = "Ціна не може бути від'ємною.";
    }

    if (form.price_per_lesson && Number(form.price_per_lesson) < 0) {
      nextErrors.price_per_lesson = "Ціна одного заняття не може бути від'ємною.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: SubscriptionPlanPayload = {
      name: form.name.trim(),
      description: form.description ? form.description : undefined,
      lessons_count: Number(form.lessons_count),
      duration_days: Number(form.duration_days),
      grace_period_days: form.grace_period_days ? Number(form.grace_period_days) : undefined,
      price: form.price,
      price_per_lesson: form.price_per_lesson ? form.price_per_lesson : undefined,
      currency_id: Number(form.currency_id),
      course_id: form.course_id ? Number(form.course_id) : undefined,
      lesson_type: form.lesson_type ? Number(form.lesson_type) : undefined,
      is_active: form.is_active,
    };

    try {
      setErrors({});
      await createSubscriptionPlan(payload).unwrap();
      router.push("/dashboard/manager/subscription/");
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        api: formatApiError(error, "Не вдалося створити абонемент."),
      }));
    }
  };

  const lessonTypes = Array.isArray(lessonTypesData)
    ? lessonTypesData
    : lessonTypesData?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="w-fit px-0">
            <Link href="/dashboard/manager/subscription">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад до абонементів
            </Link>
          </Button>

          <h1 className="text-2xl font-bold">Додати абонемент</h1>
          <p className="text-sm text-muted-foreground">
            Заповніть дані для створення нового абонемента
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="space-y-5" onSubmit={submit}>
            {errors.api ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {errors.api}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2" data-field-root>
                <RequiredLabel required>Назва</RequiredLabel>
                <Input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Наприклад: Абонемент на 8 занять"
                  disabled={isLoading}
                  aria-invalid={!!errors.name}
                />
                {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <RequiredLabel>Опис</RequiredLabel>
                <Textarea
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Короткий опис абонемента"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2" data-field-root>
                <RequiredLabel required>Кількість уроків</RequiredLabel>
                <Input
                  type="number"
                  min={1}
                  value={form.lessons_count}
                  onChange={(event) => updateField("lessons_count", event.target.value)}
                  placeholder="8"
                  disabled={isLoading}
                  aria-invalid={!!errors.lessons_count}
                />
                {errors.lessons_count ? (
                  <p className="text-sm text-destructive">{errors.lessons_count}</p>
                ) : null}
              </div>

              <div className="space-y-2" data-field-root>
                <RequiredLabel required>Тривалість у днях</RequiredLabel>
                <Input
                  type="number"
                  min={1}
                  value={form.duration_days}
                  onChange={(event) => updateField("duration_days", event.target.value)}
                  placeholder="30"
                  disabled={isLoading}
                  aria-invalid={!!errors.duration_days}
                />
                {errors.duration_days ? (
                  <p className="text-sm text-destructive">{errors.duration_days}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <RequiredLabel>Пільговий період</RequiredLabel>
                <Input
                  type="number"
                  min={0}
                  value={form.grace_period_days}
                  onChange={(event) => updateField("grace_period_days", event.target.value)}
                  placeholder="0"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2" data-field-root>
                <RequiredLabel required>Ціна</RequiredLabel>
                <Input
                  value={form.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  placeholder="1200.00"
                  disabled={isLoading}
                  aria-invalid={!!errors.price}
                />
                {errors.price ? <p className="text-sm text-destructive">{errors.price}</p> : null}
              </div>

              <div className="space-y-2">
                <RequiredLabel>Ціна одного заняття</RequiredLabel>
                <Input
                  value={form.price_per_lesson}
                  onChange={(event) => updateField("price_per_lesson", event.target.value)}
                  placeholder="150.00"
                  disabled={isLoading}
                />
                {errors.price_per_lesson ? (
                  <p className="text-sm text-destructive">{errors.price_per_lesson}</p>
                ) : null}
              </div>

              <div className="space-y-2" data-field-root>
                <RequiredLabel required>Валюта</RequiredLabel>
                <Select
                  value={form.currency_id}
                  onValueChange={(value) => updateField("currency_id", value)}
                  disabled={isLoading || isCurrenciesLoading}
                >
                  <SelectTrigger aria-invalid={!!errors.currency_id}>
                    <SelectValue placeholder="Оберіть валюту" />
                  </SelectTrigger>

                  <SelectContent>
                    {currenciesData?.results?.map((currency: any) => (
                      <SelectItem key={currency.id} value={String(currency.id)}>
                        {currency.code ? currency.code : "Немає"}
                        {currency.symbol ? ` (${currency.symbol})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency_id ? <p className="text-sm text-destructive">{errors.currency_id}</p> : null}
              </div>

              <div className="space-y-2">
                <RequiredLabel>Курс</RequiredLabel>
                <Select
                  value={form.course_id}
                  onValueChange={(value) => updateField("course_id", value)}
                  disabled={isLoading || isCoursesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть курс" />
                  </SelectTrigger>

                  <SelectContent>
                    {coursesData?.results?.map((course: any) => (
                      <SelectItem key={course.id} value={String(course.id)}>
                        {course.title ? course.title : "Немає"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <RequiredLabel>Тип уроку</RequiredLabel>
                <Select
                  value={form.lesson_type}
                  onValueChange={(value) => updateField("lesson_type", value)}
                  disabled={isLoading || isLessonTypesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть тип уроку" />
                  </SelectTrigger>

                  <SelectContent>
                    {lessonTypes.map((lessonType: any) => (
                      <SelectItem key={lessonType.id} value={String(lessonType.id)}>
                        {lessonType.name ? lessonType.name : "Немає"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-2xl border p-4 md:col-span-2">
                <div>
                  <RequiredLabel>Активний абонемент</RequiredLabel>
                  <p className="text-sm text-muted-foreground">
                    Якщо вимкнути, абонемент буде неактивним
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => updateField("is_active", event.target.checked)}
                  disabled={isLoading}
                  className="h-5 w-5 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild disabled={isLoading}>
                <Link href="/dashboard/manager/subscription/">Скасувати</Link>
              </Button>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Створення..." : "Створити"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
