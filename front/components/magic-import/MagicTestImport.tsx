"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle2,
    Loader2,
    Sparkles,
    Trash2,
    Upload,
    XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useImportMagicTestMutation } from "@/store/magic-import/magic-test.api";
import {
    MAGIC_QUESTION_TYPE_LABELS,
    MagicQuestion,
    MagicTestResponse,
} from "@/store/magic-import/magic-test.type";

import {
    useAddQuestionsToVersionMutation,
    useCreateQuestionMutation,
    useCreateTestMutation,
    useCreateTestVersionMutation,
} from "@/store/test-management/test-management.api";
import {
    QuestionPayload,
    TypeEnum,
} from "@/store/test-management/test-management.type";

export function MagicTestImport() {
    const router = useRouter();

    const [photo, setPhoto] = useState<File | null>(null);
    const [result, setResult] = useState<MagicTestResponse | null>(null);
    const [errorText, setErrorText] = useState("");
    const [testTitle, setTestTitle] = useState("");
    const [testDescription, setTestDescription] = useState("");

    const [importMagicTest, { isLoading }] = useImportMagicTestMutation();
    const [createTest, { isLoading: isCreatingTest }] = useCreateTestMutation();
    const [createQuestion] = useCreateQuestionMutation();
    const [createTestVersion] = useCreateTestVersionMutation();
    const [addQuestionsToVersion] = useAddQuestionsToVersionMutation();

    const cleanedQuestions = useMemo(() => {
        if (!result?.questions?.length) return [];

        return result.questions.filter((question) => {
            const text = question.text.trim().toLowerCase();

            return (
                text &&
                !text.includes("кожна правильна відповідь") &&
                !text.includes("робота виконана") &&
                !text.includes("перевірив") &&
                !text.includes("підпис") &&
                !text.includes("п.і.б")
            );
        });
    }, [result]);

    const totalPoints = useMemo(() => {
        return cleanedQuestions.reduce((sum, question) => {
            return sum + Number(question.points || 0);
        }, 0);
    }, [cleanedQuestions]);

    const isSaving = isCreatingTest;

    const handleSubmit = async () => {
        if (!photo) {
            setErrorText("Оберіть фото тесту");
            return;
        }

        try {
            setErrorText("");
            setResult(null);

            const response = await importMagicTest({
                photo,
            }).unwrap();

            setResult(response);

            if (!testTitle.trim() && response.questions?.[0]?.text) {
                setTestTitle("Тест з фото");
            }

            if (!testDescription.trim()) {
                setTestDescription("Тест створено через AI імпорт");
            }
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
                    "Не вдалося розпізнати тест"
            );
        }
    };

    const handleRemoveQuestion = (questionIndex: number) => {
        if (!result) return;

        const targetQuestion = cleanedQuestions[questionIndex];

        setResult({
            questions: result.questions.filter((question) => question !== targetQuestion),
        });
    };

    const handleCreateTest = async () => {
        if (!testTitle.trim()) {
            setErrorText("Вкажіть назву тесту");
            return;
        }

        if (!cleanedQuestions.length) {
            setErrorText("Немає питань для створення тесту");
            return;
        }

        try {
            setErrorText("");

            const createdTest = await createTest({
                title: testTitle.trim(),
                description: testDescription.trim() || "Немає",
            }).unwrap();

            let versionId = createdTest.current_version?.id;

            if (!versionId) {
                const createdVersion = await createTestVersion(createdTest.id).unwrap();
                versionId = createdVersion.id;
            }

            const createdQuestions = [];

            for (const question of cleanedQuestions) {
                const payload: QuestionPayload = {
                    text: question.text || "Немає",
                    media_url: null,
                    points: Number(question.points || 1),
                    type: question.type as TypeEnum,
                    explanation: "",
                    options:
                        question.type === "open_text"
                            ? []
                            : question.options.map((option) => ({
                                option_text: option.option_text || "Немає",
                                is_correct: Boolean(option.is_correct),
                                ...(option.explanation
                                    ? { explanation: option.explanation }
                                    : {}),
                                ...(question.type === "ordering" &&
                                option.correct_order !== undefined
                                    ? { correct_order: option.correct_order }
                                    : {}),
                                ...(question.type === "matching" && option.match_pair_text
                                    ? { match_pair_text: option.match_pair_text }
                                    : {}),
                                ...(question.type === "fill_in_the_blank" &&
                                option.blank_group_id !== undefined
                                    ? { blank_group_id: option.blank_group_id }
                                    : {}),
                            })),
                };

                const createdQuestion = await createQuestion(payload).unwrap();

                createdQuestions.push(createdQuestion);
            }

            await addQuestionsToVersion({
                id: versionId,
                data: {
                    question_ids: createdQuestions.map((question) => question.id),
                },
            }).unwrap();

            router.push("/lms/teacher/test-management");
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
                    "Не вдалося створити тест"
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
                                <h1 className="text-xl font-semibold">AI імпорт тесту</h1>
                                <p className="text-sm text-muted-foreground">
                                    Завантажте фото тесту, перевірте результат і створіть тест у
                                    системі.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Назва тесту</Label>
                        <Input
                            value={testTitle}
                            onChange={(e) => {
                                setTestTitle(e.target.value);
                            }}
                            placeholder="Наприклад: Загальна будова двигуна"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Опис тесту</Label>
                        <Input
                            value={testDescription}
                            onChange={(e) => {
                                setTestDescription(e.target.value);
                            }}
                            placeholder="Короткий опис тесту"
                        />
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="space-y-2">
                        <Label>Фото тесту</Label>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                setPhoto(e.target.files?.[0] ?? null);
                            }}
                        />

                        <p className="text-xs text-muted-foreground">
                            Краще завантажувати чітке фото без обрізаних країв.
                        </p>
                    </div>

                    <Button
                        className="cursor-pointer gap-2"
                        disabled={isLoading || !photo}
                        onClick={handleSubmit}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        Розпізнати тест
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

            {result && (
                <div className="space-y-4">
                    <Card className="p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Результат розпізнавання
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                    Питань: {cleanedQuestions.length} · Балів: {totalPoints}
                                </p>

                                {result.questions.length !== cleanedQuestions.length && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Службові рядки автоматично приховані з результату.
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    variant="outline"
                                    className="cursor-pointer"
                                    disabled={isSaving}
                                    onClick={() => {
                                        setResult(null);
                                        setErrorText("");
                                    }}
                                >
                                    Очистити
                                </Button>

                                <Button
                                    className="cursor-pointer"
                                    disabled={isSaving || !cleanedQuestions.length}
                                    onClick={handleCreateTest}
                                >
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Створити тест
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {cleanedQuestions.length ? (
                        cleanedQuestions.map((question: MagicQuestion, questionIndex) => (
                            <Card key={`${question.text}-${questionIndex}`} className="p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold">
                                                Питання {questionIndex + 1}
                                            </p>

                                            <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                        {MAGIC_QUESTION_TYPE_LABELS[question.type] ||
                            question.type ||
                            "Немає"}
                      </span>

                                            <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                        Балів: {question.points ?? "Немає"}
                      </span>
                                        </div>

                                        <h3 className="break-words text-base font-medium">
                                            {question.text || "Немає"}
                                        </h3>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="cursor-pointer text-muted-foreground hover:text-destructive"
                                        disabled={isSaving}
                                        onClick={() => handleRemoveQuestion(questionIndex)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                {question.type === "open_text" ? (
                                    <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                                        <p className="text-sm text-muted-foreground">
                                            Відкрите питання без варіантів відповіді.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-sm font-medium">Варіанти відповідей</p>

                                        {question.options.length ? (
                                            question.options.map((option, optionIndex) => (
                                                <div
                                                    key={`${option.option_text}-${optionIndex}`}
                                                    className="rounded-lg border p-3"
                                                >
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="min-w-0 space-y-2">
                                                            <p className="break-words text-sm">
                                                                {option.option_text || "Немає"}
                                                            </p>

                                                            {option.explanation && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Пояснення:{" "}
                                                                    <span className="text-foreground">
                                    {option.explanation}
                                  </span>
                                                                </p>
                                                            )}

                                                            {question.type === "ordering" &&
                                                                option.correct_order !== undefined && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Порядок:{" "}
                                                                        <span className="text-foreground">
                                      {option.correct_order}
                                    </span>
                                                                    </p>
                                                                )}

                                                            {question.type === "matching" &&
                                                                option.match_pair_text && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Пара:{" "}
                                                                        <span className="text-foreground">
                                      {option.match_pair_text}
                                    </span>
                                                                    </p>
                                                                )}

                                                            {question.type === "fill_in_the_blank" &&
                                                                option.blank_group_id !== undefined && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Група пропуску:{" "}
                                                                        <span className="text-foreground">
                                      {option.blank_group_id}
                                    </span>
                                                                    </p>
                                                                )}
                                                        </div>

                                                        <div className="flex shrink-0 items-center gap-2">
                                                            {option.is_correct ? (
                                                                <>
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    <span className="rounded-full border px-2 py-1 text-xs">
                                    Правильна
                                  </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                                    Не правильна
                                  </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Немає</p>
                                        )}
                                    </div>
                                )}
                            </Card>
                        ))
                    ) : (
                        <Card className="p-5">
                            <p className="text-sm text-muted-foreground">
                                Немає питань для створення тесту.
                            </p>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}