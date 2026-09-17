"use client";

import React, { ChangeEvent, useState } from "react";
import {
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    Copy,
    GraduationCap,
    ImagePlus,
    LinkIcon,
    Loader2,
    Send,
    Trash2,
    UserCog,
    Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/libs/utils";
import {
    useGetTelegramStartLinkQuery,
    useSendTelegramBroadcastingMutation,
} from "@/store/telegram/telegram.api";
import { useGetGroupsQuery } from "@/store/groups/group.api";
import { useGetUsersQuery} from "@/store/users/user.api";

type TargetType = "all" | "roles" | "groups" | "users";

export default function ManagerTelegramPage() {
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [targetType, setTargetType] = useState<TargetType>("all");
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [errorText, setErrorText] = useState("");
    const [successText, setSuccessText] = useState("");
    const [copied, setCopied] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(1);

    const { data: startLinkData, isLoading: isStartLinkLoading } =
        useGetTelegramStartLinkQuery();

    const { data: groupsData, isLoading: isGroupsLoading } = useGetGroupsQuery({
        page: 1,
    });

    const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery({
        page: 1,
    });

    const [sendTelegramBroadcasting, { isLoading: isSending }] =
        useSendTelegramBroadcastingMutation();

    const roleOptions = [
        {
            value: "student",
            label: "Студенти",
            description: "Усі користувачі з роллю студента",
            icon: Users,
        },
        {
            value: "teacher",
            label: "Викладачі",
            description: "Усі користувачі з роллю викладача",
            icon: GraduationCap,
        },
        {
            value: "manager",
            label: "Менеджери",
            description: "Усі користувачі з роллю менеджера",
            icon: UserCog,
        },
        {
            value: "methodist",
            label: "Методисти",
            description: "Усі користувачі з роллю методиста",
            icon: BarChart3,
        },
        {
            value: "financier",
            label: "Фінансисти",
            description: "Усі користувачі з роллю фінансиста",
            icon: BarChart3,
        },
    ];

    const targetOptions = [
        {
            value: "all" as TargetType,
            label: "Усім",
            description: "Розсилка всім користувачам Telegram",
        },
        {
            value: "roles" as TargetType,
            label: "За ролями",
            description: "Розсилка тільки вибраним ролям",
        },
        {
            value: "groups" as TargetType,
            label: "За групами",
            description: "Розсилка тільки вибраним групам",
        },
        {
            value: "users" as TargetType,
            label: "Користувачам",
            description: "Розсилка конкретним користувачам",
        },
    ];

    const isSubmitDisabled =
        isSending ||
        (!message.trim() && files.length === 0) ||
        (targetType === "roles" && selectedRoles.length === 0) ||
        (targetType === "groups" && selectedGroups.length === 0) ||
        (targetType === "users" && selectedUsers.length === 0);

    const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
        setErrorText("");
        setSuccessText("");

        const nextFiles = Array.from(event.target.files || []);

        setFiles(nextFiles);
    };

    const handleSubmit = async () => {
        setErrorText("");
        setSuccessText("");

        if (!message.trim() && files.length === 0) {
            setErrorText("Додайте текст повідомлення або зображення.");
            return;
        }

        if (targetType === "roles" && selectedRoles.length === 0) {
            setErrorText("Оберіть хоча б одну роль для розсилки.");
            return;
        }

        if (targetType === "groups" && selectedGroups.length === 0) {
            setErrorText("Оберіть хоча б одну групу для розсилки.");
            return;
        }

        if (targetType === "users" && selectedUsers.length === 0) {
            setErrorText("Оберіть хоча б одного користувача для розсилки.");
            return;
        }

        try {
            await sendTelegramBroadcasting({
                message,
                files,
                roles: targetType === "roles" ? selectedRoles : undefined,
                groups: targetType === "groups" ? selectedGroups : undefined,
                users: targetType === "users" ? selectedUsers : undefined,
            }).unwrap();

            setMessage("");
            setFiles([]);
            setSelectedRoles([]);
            setSelectedGroups([]);
            setSelectedUsers([]);
            setTargetType("all");
            setFileInputKey((prev) => prev + 1);
            setSuccessText("Розсилку успішно відправлено.");
        } catch (error: any) {
            setErrorText(
                error?.data?.detail ||
                error?.data?.message ||
                (typeof error?.data === "string" ? error.data : null) ||
                "Не вдалося відправити розсилку."
            );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Управління телеграм ботом
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Тут можна переглянути стартове посилання бота та зробити розсилку
                        тексту або зображень.
                    </p>
                </div>
            </div>

            <Card className="overflow-hidden border bg-card">
                <div className="border-b bg-muted/30 p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <LinkIcon className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold">Стартове посилання</h2>
                            <p className="text-sm text-muted-foreground">
                                Його можна надіслати користувачу, щоб він підключив Telegram.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Посилання
                            </p>

                            <p className="mt-1 break-all text-sm font-medium">
                                {isStartLinkLoading ? "Завантаження..." : startLinkData?.link || "Немає"}
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="shrink-0 gap-2"
                            disabled={!startLinkData?.link}
                            onClick={() => {
                                if (!startLinkData?.link) return;

                                navigator.clipboard.writeText(startLinkData.link);
                                setCopied(true);

                                setTimeout(() => {
                                    setCopied(false);
                                }, 1500);
                            }}
                        >
                            {copied ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                            {copied ? "Скопійовано" : "Скопіювати"}
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden border bg-card">
                <div className="border-b bg-muted/30 p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Send className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold">Розсилка</h2>
                            <p className="text-sm text-muted-foreground">
                                Відправлення повідомлення в Telegram користувачам.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 p-5">
                    {errorText ? (
                        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                            <p>{errorText}</p>
                        </div>
                    ) : null}

                    {successText ? (
                        <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                            <p>{successText}</p>
                        </div>
                    ) : null}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Кому відправити</label>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {targetOptions.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => {
                                        setTargetType(item.value);
                                        setErrorText("");
                                        setSuccessText("");
                                    }}
                                    className={cn(
                                        "rounded-2xl border p-4 text-left transition hover:border-primary/60 hover:bg-primary/5",
                                        targetType === item.value
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "bg-background"
                                    )}
                                >
                                    <p className="font-semibold">{item.label}</p>
                                    <p
                                        className={cn(
                                            "mt-1 text-sm",
                                            targetType === item.value
                                                ? "text-primary/80"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {item.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {targetType === "roles" ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Оберіть ролі</label>

                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {roleOptions.map((role) => {
                                    const Icon = role.icon;
                                    const active = selectedRoles.includes(role.value);

                                    return (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => {
                                                setErrorText("");
                                                setSuccessText("");

                                                setSelectedRoles((prev) =>
                                                    prev.includes(role.value)
                                                        ? prev.filter((item) => item !== role.value)
                                                        : [...prev, role.value]
                                                );
                                            }}
                                            className={cn(
                                                "flex items-start gap-3 rounded-2xl border p-4 text-left transition hover:border-primary/60 hover:bg-primary/5",
                                                active
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "bg-background"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                                    active ? "bg-primary text-primary-foreground" : "bg-muted"
                                                )}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>

                                            <div>
                                                <p className="font-semibold">{role.label}</p>
                                                <p
                                                    className={cn(
                                                        "mt-1 text-sm",
                                                        active ? "text-primary/80" : "text-muted-foreground"
                                                    )}
                                                >
                                                    {role.description}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

                    {targetType === "groups" ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Оберіть групи</label>

                            {isGroupsLoading ? (
                                <div className="flex items-center gap-2 rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Завантаження груп...
                                </div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {groupsData?.results?.length ? (
                                        groupsData.results.map((group: any) => {
                                            const active = selectedGroups.includes(group.id);

                                            return (
                                                <button
                                                    key={group.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setErrorText("");
                                                        setSuccessText("");

                                                        setSelectedGroups((prev) =>
                                                            prev.includes(group.id)
                                                                ? prev.filter((item) => item !== group.id)
                                                                : [...prev, group.id]
                                                        );
                                                    }}
                                                    className={cn(
                                                        "rounded-2xl border p-4 text-left transition hover:border-primary/60 hover:bg-primary/5",
                                                        active
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "bg-background"
                                                    )}
                                                >
                                                    <p className="font-semibold">
                                                        {group.name || group.title || "Немає"}
                                                    </p>
                                                    <p
                                                        className={cn(
                                                            "mt-1 text-sm",
                                                            active
                                                                ? "text-primary/80"
                                                                : "text-muted-foreground"
                                                        )}
                                                    >
                                                        {group.course?.name ||
                                                            group.course?.title ||
                                                            group.school?.name ||
                                                            "Група"}
                                                    </p>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
                                            Групи не знайдено.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null}

                    {targetType === "users" ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Оберіть користувачів</label>

                            {isUsersLoading ? (
                                <div className="flex items-center gap-2 rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Завантаження користувачів...
                                </div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {usersData?.results?.length ? (
                                        usersData.results.map((user: any) => {
                                            const active = selectedUsers.includes(user.id);

                                            return (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setErrorText("");
                                                        setSuccessText("");

                                                        setSelectedUsers((prev) =>
                                                            prev.includes(user.id)
                                                                ? prev.filter((item) => item !== user.id)
                                                                : [...prev, user.id]
                                                        );
                                                    }}
                                                    className={cn(
                                                        "rounded-2xl border p-4 text-left transition hover:border-primary/60 hover:bg-primary/5",
                                                        active
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "bg-background"
                                                    )}
                                                >
                                                    <p className="font-semibold">
                                                        {user.full_name || user.email || "Немає"}
                                                    </p>
                                                    <p
                                                        className={cn(
                                                            "mt-1 text-sm",
                                                            active
                                                                ? "text-primary/80"
                                                                : "text-muted-foreground"
                                                        )}
                                                    >
                                                        {user.role?.name || user.role?.slug || user.email || "Користувач"}
                                                    </p>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
                                            Користувачів не знайдено.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Текст повідомлення</label>

                        <textarea
                            value={message}
                            onChange={(event) => {
                                setMessage(event.target.value);
                                setErrorText("");
                                setSuccessText("");
                            }}
                            placeholder="Напишіть текст розсилки..."
                            className="min-h-[160px] w-full resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Зображення</label>

                        <div className="rounded-2xl border border-dashed bg-background p-5">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <ImagePlus className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="font-medium">Додайте одне або декілька зображень</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Підтримуються файли зображень. Вони будуть відправлені разом
                                            із повідомленням.
                                        </p>
                                    </div>
                                </div>

                                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border bg-card px-4 py-2 text-sm font-medium transition hover:bg-accent">
                                    Обрати файли
                                    <input
                                        key={fileInputKey}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleFilesChange}
                                    />
                                </label>
                            </div>

                            {files.length > 0 ? (
                                <div className="mt-4 space-y-2">
                                    {files.map((file, index) => (
                                        <div
                                            key={`${file.name}-${index}`}
                                            className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setFiles((prev) =>
                                                        prev.filter((_, fileIndex) => fileIndex !== index)
                                                    );
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-5 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Якщо обрано “Усім”, ролі, групи та користувачі не передаються.
                        </p>

                        <Button
                            type="button"
                            className="gap-2"
                            disabled={isSubmitDisabled}
                            onClick={handleSubmit}
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            {isSending ? "Відправлення..." : "Відправити розсилку"}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}