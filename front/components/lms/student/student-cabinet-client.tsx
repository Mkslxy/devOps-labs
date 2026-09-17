"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Mail,
    MapPin,
    Phone,
    School,
    User,
    CalendarDays,
    Hash,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetUserByIdQuery } from "@/store/users/user.api";

interface Props {
    studentId: number;
}

export function StudentCabinetClient({ studentId }: Props) {
    const {
        data: student,
        isLoading,
        error,
        refetch,
    } = useGetUserByIdQuery(studentId, {
        skip: !studentId || Number.isNaN(studentId),
    });

    if (!studentId || Number.isNaN(studentId)) {
        return (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                <p className="font-semibold">Некоректний номер студента</p>
                <p className="mt-1 text-sm">
                    Неможливо відкрити кабінет студента.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                    <p className="mt-2 text-muted-foreground">
                        Завантаження кабінету студента...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                <p className="font-semibold">
                    Помилка при завантаженні студента
                </p>

                <p className="mt-1 text-sm">
                    Будь ласка, спробуйте оновити сторінку.
                </p>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => refetch()}
                >
                    Спробувати знову
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Кабінет студента</h1>
                    <p className="text-sm text-muted-foreground">
                        Основна інформація про студента
                    </p>
                </div>

                <Button asChild variant="outline">
                    <Link href="/dashboard/financier/payments/debtors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Назад до боргів
                    </Link>
                </Button>
            </div>

            <Card className="overflow-hidden">
                <div className="border-b bg-muted/40 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="h-8 w-8" />
                        </div>

                        <div className="min-w-0">
                            <h2 className="break-words text-xl font-semibold">
                                {student.full_name || "Немає"}
                            </h2>

                            <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1">
                                    <Hash className="h-3.5 w-3.5" />
                                    Номер: {student.id || "Немає"}
                                </span>

                                <span className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1">
                                    <Mail className="h-3.5 w-3.5" />
                                    {student.email || "Немає"}
                                </span>

                                <span className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1">
                                    <Phone className="h-3.5 w-3.5" />
                                    {student.phone_normalized || "Немає"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <CardContent className="p-5">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="flex items-start gap-3 rounded-lg border p-3">
                            <User className="mt-0.5 h-4 w-4 text-muted-foreground" />

                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                    Повне імʼя
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {student.full_name || "Немає"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-lg border p-3">
                            <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />

                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                    Email
                                </p>
                                <p className="break-all text-sm font-medium">
                                    {student.email || "Немає"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-lg border p-3">
                            <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />

                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                    Телефон
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {student.phone_normalized || "Немає"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-lg border p-3">
                            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />

                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                    Місто
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {student.city || "Немає"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-lg border p-3">
                            <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />

                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                    Дата народження
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {student.date_of_birth || "Немає"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-lg border p-3">
                            <Hash className="mt-0.5 h-4 w-4 text-muted-foreground" />

                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                    Номер студента
                                </p>
                                <p className="break-words text-sm font-medium">
                                    {student.id || "Немає"}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="w-[250px]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <School className="h-4 w-4" />
                            Школи
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        {student.schools?.length ? (
                            <div className="space-y-2">
                                {student.schools.map((school) => (
                                    <div
                                        key={school.id}
                                        className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                                    >
                                        {school.name || "Немає"}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed p-4 text-center">
                                <School className="mx-auto h-6 w-6 text-muted-foreground" />

                                <p className="mt-2 text-sm font-medium">
                                    Школи не привʼязані
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Для цього студента поки немає школи.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}