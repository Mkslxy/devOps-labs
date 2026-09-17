"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import {
  useGetSubscriptionPlanByIdQuery,
  useUpdateSubscriptionPlanMutation,
} from "@/store/subscription/subscription-plan.api";
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

export default function EditSubscriptionPlanPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { data: plan, isLoading: isPlanLoading } = useGetSubscriptionPlanByIdQuery(id, {
    skip: !id,
  });
  const [updateSubscriptionPlan, { isLoading }] = useUpdateSubscriptionPlanMutation();

  const { data: coursesData, isLoading: isCoursesLoading } = useGetCoursesQuery({ page: 1 });
  const { data: currenciesData, isLoading: isCurrenciesLoading } = useGetPnlCurrenciesQuery({ page: 1 });
  const { data: lessonTypesData, isLoading: isLessonTypesLoading } = useGetLessonTypesQuery();

  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const currencies = useMemo(() => {
    const items = Array.isArray(currenciesData) ? currenciesData : currenciesData?.results || [];
    const current = plan?.currency?.id && !items.some((currency: any) => currency.id === plan.currency?.id)
      ? [plan.currency]
      : [];

    return [...current, ...items].filter(
      (currency: any, index: number, array: any[]) =>
        currency?.id !== undefined &&
        currency?.id !== null &&
        array.findIndex((item: any) => String(item.id) === String(currency.id)) === index
    );
  }, [currenciesData, plan]);

  const courses = useMemo(() => {
    const items = Array.isArray(coursesData) ? coursesData : coursesData?.results || [];
    const current = plan?.course?.id && !items.some((course: any) => course.id === plan.course?.id)
      ? [plan.course]
      : [];

    return [...current, ...items].filter(
      (course: any, index: number, array: any[]) =>
        course?.id !== undefined &&
        course?.id !== null &&
        array.findIndex((item: any) => String(item.id) === String(course.id)) === index
    );
  }, [coursesData, plan]);

  const lessonTypes = useMemo(() => {
    const items = Array.isArray(lessonTypesData)
      ? lessonTypesData
      : (lessonTypesData as any)?.results ||
        (lessonTypesData as any)?.lesson_types ||
        (lessonTypesData as any)?.types ||
        (lessonTypesData as any)?.data ||
        [];

    const current =
      plan?.lesson_type !== undefined &&
      plan.lesson_type !== null &&
      !items.some((lessonType: any) => {
        const itemId = lessonType.id ?? lessonType.value ?? lessonType.pk ?? lessonType.type;
        return String(itemId) === String(plan.lesson_type);
      })
        ? [{ id: plan.lesson_type, name: `Тип уроку #${plan.lesson_type}` }]
        : [];

    return [...current, ...items].filter((lessonType: any, index: number, array: any[]) => {
      const currentId = lessonType.id ?? lessonType.value ?? lessonType.pk ?? lessonType.type;
      return (
        currentId !== undefined &&
        currentId !== null &&
        array.findIndex((item: any) => {
          const itemId = item.id ?? item.value ?? item.pk ?? item.type;
          return String(itemId) === String(currentId);
        }) === index
      );
    });
  }, [lessonTypesData, plan]);

  useEffect(() => {
    if (!plan) return;

    setForm({
      name: plan.name ? plan.name : "",
      description: plan.description ? plan.description : "",
      lessons_count:
        plan.lessons_count !== undefined && plan.lessons_count !== null
          ? String(plan.lessons_count)
          : "",
      duration_days:
        plan.duration_days !== undefined && plan.duration_days !== null
          ? String(plan.duration_days)
          : "",
      grace_period_days:
        plan.grace_period_days !== undefined && plan.grace_period_days !== null
          ? String(plan.grace_period_days)
          : "",
      price: plan.price !== undefined && plan.price !== null ? String(plan.price) : "",
      price_per_lesson:
        plan.price_per_lesson !== undefined && plan.price_per_lesson !== null
          ? String(plan.price_per_lesson)
          : "",
      currency_id:
        (plan as any)?.currency_value !== undefined && (plan as any)?.currency_value !== null
          ? String((plan as any).currency_value)
          : plan.currency?.id !== undefined && plan.currency?.id !== null
            ? String(plan.currency.id)
            : "",
      course_id:
        (plan as any)?.course_value !== undefined && (plan as any)?.course_value !== null
          ? String((plan as any).course_value)
          : plan.course?.id !== undefined && plan.course?.id !== null
            ? String(plan.course.id)
            : "",
      lesson_type:
        plan.lesson_type !== undefined && plan.lesson_type !== null ? String(plan.lesson_type) : "",
      is_active: plan.is_active !== undefined ? plan.is_active : true,
    });
    setErrors({});
  }, [plan]);

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
      await updateSubscriptionPlan({ id, data: payload }).unwrap();
      router.push("/dashboard/manager/subscription/");
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        api: formatApiError(error, "Не вдалося оновити абонемент."),
      }));
    }
  };

  if (isPlanLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-[420px] animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="w-fit px-0">
            <Link href="/dashboard/manager/subscription/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад до абонементів
            </Link>
          </Button>

          <h1 className="text-2xl font-bold">Редагувати абонемент</h1>
          <p className="text-sm text-muted-foreground">
            Змініть дані абонемента та збережіть оновлення
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
                  aria-invalid={!!errors.price_per_lesson}
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
                    {currencies.map((currency: any) => (
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
                    {courses.map((course: any) => (
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
                    {lessonTypes.map((lessonType: any) => {
                      const itemId = lessonType.id ?? lessonType.value ?? lessonType.pk ?? lessonType.type;
                      return (
                        <SelectItem key={String(itemId)} value={String(itemId)}>
                          {lessonType.name || lessonType.title || lessonType.label || `Тип уроку #${itemId}`}
                        </SelectItem>
                      );
                    })}
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
                {isLoading ? "Збереження..." : "Зберегти зміни"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
