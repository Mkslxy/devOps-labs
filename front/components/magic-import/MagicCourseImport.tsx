"use client";

import React, { useState } from "react";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useImportMagicCourseMutation } from "@/store/magic-import/magic-course.api";
import { MagicCourseResponse } from "@/store/magic-import/magic-course.type";

import { useGetSubjectsQuery } from "@/store/subject/subject.api";
import { useCreateCourseMutation } from "@/store/groups/group.api";
import { useCreateModuleMutation } from "@/store/module/module.api";
import { useCreateTopicMutation } from "@/store/topic/topic.api";
import { useCreateMaterialMutation } from "@/store/material/material.api";
import { AccessLevelEnum } from "@/store/material/material.type";
import { useCreateTaskMutation } from "@/store/task-default/task-default.api";

export function MagicCourseImport() {
    const [file, setFile] = useState<File | null>(null);
    const [subjectId, setSubjectId] = useState("");
    const [result, setResult] = useState<MagicCourseResponse | null>(null);
    const [errorText, setErrorText] = useState("");
    const [successText, setSuccessText] = useState("");
    const [savedCourseId, setSavedCourseId] = useState<number | null>(null);

    const { data: subjectsData, isLoading: isSubjectsLoading } = useGetSubjectsQuery({
        page: 1,
        page_size: 50,
    });

    const [importMagicCourse, { isLoading }] = useImportMagicCourseMutation();

    const [createCourse, { isLoading: isCreatingCourse }] =
        useCreateCourseMutation();
    const [createModule, { isLoading: isCreatingModule }] =
        useCreateModuleMutation();
    const [createTopic, { isLoading: isCreatingTopic }] =
        useCreateTopicMutation();
    const [createMaterial, { isLoading: isCreatingMaterial }] =
        useCreateMaterialMutation();
    const [createTask, { isLoading: isCreatingTask }] =
        useCreateTaskMutation();

    const isSaving =
        isCreatingCourse ||
        isCreatingModule ||
        isCreatingTopic ||
        isCreatingMaterial ||
        isCreatingTask;

    const handleSubmit = async () => {
        if (!file) {
            setErrorText("Оберіть файл курсу");
            return;
        }

        try {
            setErrorText("");
            setSuccessText("");
            setSavedCourseId(null);
            setResult(null);

            const response = await importMagicCourse({
                file,
            }).unwrap();

            setResult(response);
        } catch (error) {
            const apiError = error as {
                data?: { detail?: string; message?: string } | string;
            };

            setErrorText(
                typeof apiError.data === "string"
                    ? apiError.data
                    : apiError.data?.detail ||
                    apiError.data?.message ||
                    (apiError.data ? JSON.stringify(apiError.data, null, 2) : null) ||
                    "Не вдалося розпізнати курс"
            );
        }
    };

    const handleSaveCourse = async () => {
        if (!result) {
            setErrorText("Спочатку розпізнайте курс");
            return;
        }

        if (!subjectId) {
            setErrorText("Оберіть предмет курсу");
            return;
        }

        if (savedCourseId) {
            setErrorText("Цей курс вже збережено");
            return;
        }

        try {
            setErrorText("");
            setSuccessText("");

            const createdCourse = await createCourse({
                title: result.course_title || "Немає",
                description: result.course_description || "",
                subject_id: Number(subjectId),
                price: "0",
                level: result.level || "",
                is_active: true,
            }).unwrap();

            for (const courseModule of result.modules ?? []) {
                const createdModule = await createModule({
                    title: courseModule.title || "Немає",
                    course: createdCourse.id,
                }).unwrap();

                for (const topic of courseModule.topics ?? []) {
                    const createdTopic = await createTopic({
                        title: topic.title || "Немає",
                        content_description: topic.content_description || "",
                        module: createdModule.id,
                    }).unwrap();

                    for (const material of topic.materials ?? []) {
                        await createMaterial({
                            topic: createdTopic.id,
                            title: material.title || "Немає",
                            description: material.description || "",
                            access_level: AccessLevelEnum.course_only,
                        }).unwrap();
                    }

                    for (const task of topic.tasks ?? []) {
                        const fd = new FormData();

                        fd.append("topic_id", String(createdTopic.id));
                        fd.append("title", task.title || "Немає");

                        if (task.description) {
                            fd.append("description", task.description);
                        }

                        await createTask(fd).unwrap();
                    }
                }
            }

            setSavedCourseId(createdCourse.id);
            setSuccessText("Курс успішно збережено");
        } catch (error) {
            const apiError = error as {
                data?: { detail?: string; message?: string } | string;
            };

            setErrorText(
                typeof apiError.data === "string"
                    ? apiError.data
                    : apiError.data?.detail ||
                    apiError.data?.message ||
                    (apiError.data ? JSON.stringify(apiError.data, null, 2) : null) ||
                    "Не вдалося зберегти курс"
            );
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Sparkles className="h-5 w-5" />
                            </div>

                            <div>
                                <h1 className="text-xl font-semibold">AI імпорт курсу</h1>
                                <p className="text-sm text-muted-foreground">
                                    Завантажте файл з навчальним матеріалом, а система сформує
                                    структуру курсу.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px_auto] lg:items-end">
                    <div className="space-y-2">
                        <Label>Файл курсу</Label>
                        <Input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={(e) => {
                                setFile(e.target.files?.[0] ?? null);
                                setSuccessText("");
                                setSavedCourseId(null);
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Предмет</Label>

                        <Select
                            value={subjectId}
                            onValueChange={(value) => {
                                setSubjectId(value);
                                setSuccessText("");
                                setSavedCourseId(null);
                            }}
                            disabled={isSubjectsLoading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Оберіть предмет" />
                            </SelectTrigger>

                            <SelectContent>
                                {subjectsData?.results?.length ? (
                                    subjectsData.results.map((subject) => (
                                        <SelectItem key={subject.id} value={String(subject.id)}>
                                            {subject.name || "Немає"}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="empty" disabled>
                                        Немає
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        className="cursor-pointer gap-2"
                        disabled={isLoading || !file}
                        onClick={handleSubmit}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        Розпізнати курс
                    </Button>
                </div>
            </Card>

            {errorText && (
                <Card className="border-destructive p-4">
                    <p className="mb-2 text-sm font-medium text-destructive">Помилка</p>
                    <pre className="max-h-[240px] overflow-auto whitespace-pre-wrap break-words text-xs text-destructive">
                        {errorText}
                    </pre>
                </Card>
            )}

            {successText && (
                <Card className="border-green-600 p-4">
                    <p className="text-sm font-medium text-green-600">{successText}</p>
                </Card>
            )}

            {result && (
                <div className="space-y-4">
                    <Card className="p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <h2 className="text-lg font-semibold">
                                        {result.course_title || "Немає"}
                                    </h2>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    {result.course_description || "Немає"}
                                </p>
                            </div>

                            <div className="flex flex-col items-start gap-2 lg:items-end">
                                <span className="w-fit rounded-full border px-3 py-1 text-xs text-muted-foreground">
                                    Рівень: {result.level || "Немає"}
                                </span>

                                <Button
                                    className="cursor-pointer gap-2"
                                    disabled={isSaving || !subjectId || Boolean(savedCourseId)}
                                    onClick={handleSaveCourse}
                                >
                                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {savedCourseId ? "Курс збережено" : "Зберегти курс"}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-3">
                        {(result.modules ?? []).length ? (
                            result.modules.map((courseModule, moduleIndex) => (
                                <Card key={moduleIndex} className="p-4">
                                    <details open={moduleIndex === 0} className="group">
                                        <summary className="cursor-pointer list-none">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Модуль {moduleIndex + 1}
                                                    </p>
                                                    <h3 className="font-semibold">
                                                        {courseModule.title || "Немає"}
                                                    </h3>
                                                </div>

                                                <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                                                    Тем: {(courseModule.topics ?? []).length}
                                                </span>
                                            </div>
                                        </summary>

                                        <div className="mt-4 space-y-3">
                                            {(courseModule.topics ?? []).length ? (
                                                courseModule.topics.map((topic, topicIndex) => (
                                                    <div key={topicIndex} className="rounded-lg border p-4">
                                                        <p className="text-sm text-muted-foreground">
                                                            Тема {topicIndex + 1}
                                                        </p>

                                                        <h4 className="font-medium">
                                                            {topic.title || "Немає"}
                                                        </h4>

                                                        <p className="mt-2 text-sm text-muted-foreground">
                                                            {topic.content_description || "Немає"}
                                                        </p>

                                                        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                                            <div className="space-y-2">
                                                                <p className="text-sm font-medium">Матеріали</p>

                                                                {(topic.materials ?? []).length ? (
                                                                    topic.materials.map(
                                                                        (material, materialIndex) => (
                                                                            <div
                                                                                key={materialIndex}
                                                                                className="rounded-md border p-3"
                                                                            >
                                                                                <p className="text-sm font-medium">
                                                                                    {material.title || "Немає"}
                                                                                </p>
                                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                                    {material.description || "Немає"}
                                                                                </p>
                                                                            </div>
                                                                        )
                                                                    )
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Немає
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="space-y-2">
                                                                <p className="text-sm font-medium">Завдання</p>

                                                                {(topic.tasks ?? []).length ? (
                                                                    topic.tasks.map((task, taskIndex) => (
                                                                        <div
                                                                            key={taskIndex}
                                                                            className="rounded-md border p-3"
                                                                        >
                                                                            <p className="text-sm font-medium">
                                                                                {task.title || "Немає"}
                                                                            </p>
                                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                                {task.description || "Немає"}
                                                                            </p>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Немає
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Немає тем
                                                </p>
                                            )}
                                        </div>
                                    </details>
                                </Card>
                            ))
                        ) : (
                            <Card className="p-5">
                                <p className="text-sm text-muted-foreground">Немає модулів</p>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}