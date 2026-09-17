"use client";

import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  Calendar,
  CheckCircle2,
  Copy,
  FileText,
  GraduationCap,
  Info,
  LinkIcon,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Paperclip,
  Phone,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  useGetProfileMeQuery,
  useGetRolesQuery,
} from "@/store/users/user.api";
import { useGetGroupsQuery } from "@/store/groups/group.api";
import {
  useGetTelegramStartLinkQuery,
  useSendTelegramBroadcastingMutation,
} from "@/store/telegram/telegram.api";

import { Group } from "@/store/groups/group.type";
import { Role, UserFormData } from "@/store/users/user.type";

type StudentWithGroups = UserFormData & {
  group_names: string[];
  group_ids: number[];
};

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState("");

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const [activeStudent, setActiveStudent] = useState<StudentWithGroups | null>(
      null
  );

  const [copiedLink, setCopiedLink] = useState(false);

  const [directMessage, setDirectMessage] = useState("");
  const [directFiles, setDirectFiles] = useState<File[]>([]);

  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastFiles, setBroadcastFiles] = useState<File[]>([]);
  const [selectedRoleSlugs, setSelectedRoleSlugs] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const { data: profile } = useGetProfileMeQuery();
  const profileId = (profile as any)?.id as number | undefined;

  const { data: telegramLinkData, isLoading: isTelegramLinkLoading } =
      useGetTelegramStartLinkQuery();

  const { data: rolesData, isLoading: isRolesLoading } = useGetRolesQuery();

  const {
    data: groupsData,
    isLoading: isGroupsLoading,
    isFetching: isGroupsFetching,
  } = useGetGroupsQuery(
      profileId
          ? {
            page_size: 50,
            teacher: profileId,
            search: search.trim() ? search.trim() : undefined,
          }
          : skipToken
  );

  const [sendTelegramBroadcasting, { isLoading: isSending }] =
      useSendTelegramBroadcastingMutation();

  const roles = useMemo<Role[]>(() => {
    const results = (rolesData as any)?.results;

    if (!Array.isArray(results)) return [];

    return results;
  }, [rolesData]);

  const groups = useMemo<Group[]>(() => {
    const results = (groupsData as any)?.results;

    if (!Array.isArray(results)) return [];

    return results;
  }, [groupsData]);

  const students = useMemo<StudentWithGroups[]>(() => {
    const map = new Map<number, StudentWithGroups>();

    groups.forEach((group) => {
      group.students?.forEach((student) => {
        if (!student.id) return;

        const current = map.get(student.id);

        if (current) {
          map.set(student.id, {
            ...current,
            group_names: group.name
                ? Array.from(new Set([...current.group_names, group.name]))
                : current.group_names,
            group_ids: Array.from(new Set([...current.group_ids, group.id])),
          });

          return;
        }

        map.set(student.id, {
          ...student,
          group_names: group.name ? [group.name] : [],
          group_ids: [group.id],
        });
      });
    });

    return Array.from(map.values());
  }, [groups]);

  const selectedGroups = useMemo(() => {
    return groups.filter((group) => selectedGroupIds.includes(group.id));
  }, [groups, selectedGroupIds]);

  const selectedStudents = useMemo(() => {
    return students.filter((student) =>
        student.id ? selectedUserIds.includes(student.id) : false
    );
  }, [students, selectedUserIds]);

  const handleSendDirectMessage = async () => {
    setErrorText("");
    setSuccessText("");

    if (!activeStudent?.id) {
      setErrorText("Не вдалося визначити студента для відправки.");
      return;
    }

    if (!directMessage.trim()) {
      setErrorText("Введіть текст повідомлення.");
      return;
    }

    try {
      await sendTelegramBroadcasting({
        message: directMessage.trim(),
        files: directFiles,
        users: [activeStudent.id],
      }).unwrap();

      setSuccessText("Повідомлення успішно надіслано студенту.");
      setDirectMessage("");
      setDirectFiles([]);
      setMessageOpen(false);
    } catch (error: any) {
      setErrorText(
          error?.data?.detail ||
          error?.data?.message ||
          (typeof error?.data === "string" ? error.data : null) ||
          "Не вдалося надіслати повідомлення."
      );
    }
  };

  const handleSendBroadcast = async () => {
    setErrorText("");
    setSuccessText("");

    const hasRecipients =
        selectedRoleSlugs.length > 0 ||
        selectedGroupIds.length > 0 ||
        selectedUserIds.length > 0;

    if (!broadcastMessage.trim()) {
      setErrorText("Введіть текст повідомлення.");
      return;
    }

    if (!hasRecipients) {
      setErrorText("Оберіть хоча б одного отримувача.");
      return;
    }

    try {
      await sendTelegramBroadcasting({
        message: broadcastMessage.trim(),
        files: broadcastFiles,
        roles: selectedRoleSlugs,
        groups: selectedGroupIds,
        users: selectedUserIds,
      }).unwrap();

      setSuccessText("Telegram-розсилку успішно надіслано.");
      setBroadcastMessage("");
      setBroadcastFiles([]);
      setSelectedRoleSlugs([]);
      setSelectedGroupIds([]);
      setSelectedUserIds([]);
      setBroadcastOpen(false);
    } catch (error: any) {
      setErrorText(
          error?.data?.detail ||
          error?.data?.message ||
          (typeof error?.data === "string" ? error.data : null) ||
          "Не вдалося надіслати Telegram-розсилку."
      );
    }
  };

  return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border bg-card">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative flex flex-col gap-5 p-5 md:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                <GraduationCap className="h-3.5 w-3.5" />
                Кабінет викладача
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Мої студенти
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Переглядайте студентів, які закріплені за вашими групами, та
                  швидко надсилайте їм Telegram-повідомлення.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                  type="button"
                  variant="outline"
                  className="gap-2 bg-background/70"
                  onClick={() => {
                    setErrorText("");
                    setSuccessText("");
                    setBroadcastOpen(true);
                  }}
              >
                <Send className="h-4 w-4" />
                Нова розсилка
              </Button>
            </div>
          </div>
        </div>

        {errorText ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-start gap-3 p-4 text-sm text-destructive">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="break-words">{errorText}</div>
              </CardContent>
            </Card>
        ) : null}

        {successText ? (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="flex items-start gap-3 p-4 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="break-words">{successText}</div>
              </CardContent>
            </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Студентів</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{groups.length}</p>
                <p className="text-sm text-muted-foreground">Моїх груп</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LinkIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Telegram-підключення</p>
                <p className="truncate text-sm text-muted-foreground">
                  {isTelegramLinkLoading
                      ? "Завантаження..."
                      : telegramLinkData?.link
                          ? "Посилання доступне"
                          : "Немає"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold">Список студентів</h2>
                <p className="text-sm text-muted-foreground">
                  Дані беруться з груп, де ви закріплені як викладач.
                </p>
              </div>

              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Пошук за назвою групи..."
                    className="pl-10"
                />
              </div>
            </div>

            {telegramLinkData?.link ? (
                <div className="flex flex-col gap-3 rounded-2xl border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Посилання для підключення Telegram
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {telegramLinkData.link}
                    </p>
                  </div>

                  <Button
                      type="button"
                      variant="outline"
                      className="gap-2 bg-background"
                      onClick={async () => {
                        await navigator.clipboard.writeText(telegramLinkData.link);
                        setCopiedLink(true);

                        setTimeout(() => {
                          setCopiedLink(false);
                        }, 1500);
                      }}
                  >
                    {copiedLink ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                    {copiedLink ? "Скопійовано" : "Скопіювати"}
                  </Button>
                </div>
            ) : null}
          </CardContent>
        </Card>

        {isGroupsLoading || isGroupsFetching ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-3xl border bg-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Завантаження студентів...
              </div>
            </div>
        ) : students.length ? (
            <div className="grid gap-4">
              {students.map((student) => {
                const phone =
                    student.phone_country_code || student.phone_national_number
                        ? `${student.phone_country_code ?? ""}${
                            student.phone_national_number ?? ""
                        }`
                        : "Немає";

                return (
                    <Card
                        key={student.id}
                        className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <CardContent className="p-4 md:p-5">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                          <div className="flex min-w-0 flex-1 items-start gap-4">
                            <Avatar className="h-14 w-14 shrink-0 md:h-16 md:w-16">
                              <AvatarFallback className="bg-primary text-base font-semibold text-primary-foreground md:text-lg">
                                {student.full_name
                                    ? student.full_name
                                        .split(" ")
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .map((name) => name[0])
                                        .join("")
                                        .toUpperCase()
                                    : "U"}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0">
                                  <h3 className="break-words text-lg font-semibold">
                                    {student.full_name || "Немає"}
                                  </h3>

                                  <div className="mt-2 grid gap-1.5 text-sm text-muted-foreground">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <Mail className="h-4 w-4 shrink-0" />
                                      <span className="break-all">
                                  {student.email || "Немає"}
                                </span>
                                    </div>

                                    <div className="flex min-w-0 items-center gap-2">
                                      <Phone className="h-4 w-4 shrink-0" />
                                      <span className="break-all">{phone}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {student.group_names.length ? (
                                      student.group_names.map((groupName) => (
                                          <Badge key={groupName} variant="secondary">
                                            {groupName}
                                          </Badge>
                                      ))
                                  ) : (
                                      <Badge variant="outline">Без групи</Badge>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="rounded-2xl bg-muted/40 p-3">
                                  <p className="text-xs text-muted-foreground">
                                    Місто
                                  </p>
                                  <p className="mt-1 break-words text-sm font-medium">
                                    {student.city || "Немає"}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-muted/40 p-3">
                                  <p className="text-xs text-muted-foreground">
                                    Дата народження
                                  </p>
                                  <p className="mt-1 break-words text-sm font-medium">
                                    {student.date_of_birth || "Немає"}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-muted/40 p-3 sm:col-span-2 lg:col-span-1">
                                  <p className="text-xs text-muted-foreground">
                                    Школи
                                  </p>
                                  <p className="mt-1 break-words text-sm font-medium">
                                    {student.schools?.length
                                        ? student.schools
                                            .map((school) => school.name || "Немає")
                                            .join(", ")
                                        : "Немає"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row xl:w-40 xl:flex-col">
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2 bg-transparent"
                                onClick={() => {
                                  setActiveStudent(student);
                                  setErrorText("");
                                  setSuccessText("");
                                  setDetailsOpen(true);
                                }}
                            >
                              <Info className="h-4 w-4" />
                              Детальніше
                            </Button>

                            <Button
                                type="button"
                                className="gap-2"
                                onClick={() => {
                                  setActiveStudent(student);
                                  setDirectMessage("");
                                  setDirectFiles([]);
                                  setErrorText("");
                                  setSuccessText("");
                                  setMessageOpen(true);
                                }}
                            >
                              <MessageCircle className="h-4 w-4" />
                              Написати
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                );
              })}
            </div>
        ) : (
            <Card>
              <CardContent className="flex min-h-[260px] flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-muted">
                  <Users className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Студентів не знайдено</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  У ваших групах поки немає студентів або за поточним пошуком немає
                  результатів.
                </p>
              </CardContent>
            </Card>
        )}

        <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Деталі студента</SheetTitle>
            </SheetHeader>

            {activeStudent ? (
                <div className="mt-6 space-y-5">
                  <div className="flex items-center gap-4 rounded-3xl border bg-card p-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                        {activeStudent.full_name
                            ? activeStudent.full_name
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((name) => name[0])
                                .join("")
                                .toUpperCase()
                            : "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold">
                        {activeStudent.full_name || "Немає"}
                      </h3>
                      <p className="break-all text-sm text-muted-foreground">
                        {activeStudent.email || "Немає"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        Пошта
                      </div>
                      <p className="mt-2 break-all font-medium">
                        {activeStudent.email || "Немає"}
                      </p>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        Телефон
                      </div>
                      <p className="mt-2 break-all font-medium">
                        {activeStudent.phone_country_code ||
                        activeStudent.phone_national_number
                            ? `${activeStudent.phone_country_code ?? ""}${
                                activeStudent.phone_national_number ?? ""
                            }`
                            : "Немає"}
                      </p>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Дата народження
                      </div>
                      <p className="mt-2 break-words font-medium">
                        {activeStudent.date_of_birth || "Немає"}
                      </p>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Місто
                      </div>
                      <p className="mt-2 break-words font-medium">
                        {activeStudent.city || "Немає"}
                      </p>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        Групи
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {activeStudent.group_names.length ? (
                            activeStudent.group_names.map((groupName) => (
                                <Badge key={groupName} variant="secondary">
                                  {groupName}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-sm font-medium">Немає</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                      type="button"
                      className="w-full gap-2"
                      onClick={() => {
                        setDetailsOpen(false);
                        setDirectMessage("");
                        setDirectFiles([]);
                        setMessageOpen(true);
                      }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Написати студенту
                  </Button>
                </div>
            ) : null}
          </SheetContent>
        </Sheet>

        <Sheet open={messageOpen} onOpenChange={setMessageOpen}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Повідомлення студенту</SheetTitle>
            </SheetHeader>

            {activeStudent ? (
                <div className="mt-6 space-y-5">
                  <div className="rounded-3xl border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Отримувач</p>
                    <p className="mt-1 break-words font-semibold">
                      {activeStudent.full_name || "Немає"}
                    </p>
                    <p className="mt-1 break-all text-sm text-muted-foreground">
                      {activeStudent.email || "Немає"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Повідомлення</label>
                    <textarea
                        value={directMessage}
                        onChange={(event) => setDirectMessage(event.target.value)}
                        placeholder="Введіть текст повідомлення для студента..."
                        className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">
                      Можна використовувати HTML-форматування.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Файли</label>

                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed bg-muted/20 p-6 text-center transition-colors hover:bg-muted/40">
                      <Paperclip className="mb-2 h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                    Натисніть, щоб обрати файли
                  </span>
                      <span className="mt-1 text-xs text-muted-foreground">
                    Максимум 10 файлів
                  </span>
                      <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(event) => {
                            setDirectFiles(
                                Array.from(event.target.files ?? []).slice(0, 10)
                            );
                          }}
                      />
                    </label>

                    {directFiles.length ? (
                        <div className="space-y-2">
                          {directFiles.map((file) => (
                              <div
                                  key={`${file.name}-${file.size}`}
                                  className="flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm"
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>

                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setDirectFiles((prev) =>
                                          prev.filter(
                                              (item) =>
                                                  !(
                                                      item.name === file.name &&
                                                      item.size === file.size
                                                  )
                                          )
                                      );
                                    }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                          ))}
                        </div>
                    ) : null}
                  </div>

                  <Button
                      type="button"
                      className="w-full gap-2"
                      disabled={isSending || !directMessage.trim()}
                      onClick={handleSendDirectMessage}
                  >
                    {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                    Надіслати повідомлення
                  </Button>
                </div>
            ) : null}
          </SheetContent>
        </Sheet>

        <Sheet open={broadcastOpen} onOpenChange={setBroadcastOpen}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
            <SheetHeader>
              <SheetTitle>Нова Telegram-розсилка</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="rounded-3xl border bg-muted/30 p-4">
                <p className="font-medium">Кому буде відправлено?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Оберіть ролі, групи або конкретних студентів. Можна поєднувати
                  кілька варіантів.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Повідомлення</label>
                <textarea
                    value={broadcastMessage}
                    onChange={(event) => setBroadcastMessage(event.target.value)}
                    placeholder="Введіть текст Telegram-розсилки..."
                    className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Можна використовувати HTML-форматування.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Ролі</p>
                  <p className="text-xs text-muted-foreground">
                    Відправка всім користувачам обраних ролей.
                  </p>
                </div>

                {isRolesLoading ? (
                    <div className="flex items-center gap-2 rounded-2xl border p-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Завантаження ролей...
                    </div>
                ) : roles.length ? (
                    <div className="flex flex-wrap gap-2">
                      {roles.map((role) => {
                        const active = selectedRoleSlugs.includes(role.slug);

                        return (
                            <button
                                key={role.slug}
                                type="button"
                                className={cn(
                                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                                    active
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "bg-background text-muted-foreground hover:bg-muted"
                                )}
                                onClick={() => {
                                  setSelectedRoleSlugs((prev) =>
                                      prev.includes(role.slug)
                                          ? prev.filter((slug) => slug !== role.slug)
                                          : [...prev, role.slug]
                                  );
                                }}
                            >
                              {role.name || role.slug}
                            </button>
                        );
                      })}
                    </div>
                ) : (
                    <p className="rounded-2xl border p-4 text-sm text-muted-foreground">
                      Ролей не знайдено.
                    </p>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Групи</p>
                  <p className="text-xs text-muted-foreground">
                    Відправка студентам з обраних груп.
                  </p>
                </div>

                {groups.length ? (
                    <div className="grid gap-2">
                      {groups.map((group) => {
                        const active = selectedGroupIds.includes(group.id);

                        return (
                            <button
                                key={group.id}
                                type="button"
                                className={cn(
                                    "flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-colors",
                                    active
                                        ? "border-primary bg-primary/10"
                                        : "bg-background hover:bg-muted"
                                )}
                                onClick={() => {
                                  setSelectedGroupIds((prev) =>
                                      prev.includes(group.id)
                                          ? prev.filter((id) => id !== group.id)
                                          : [...prev, group.id]
                                  );
                                }}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {group.name || "Немає"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Студентів: {group.students?.length ?? 0}
                                </p>
                              </div>

                              {active ? (
                                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                              ) : null}
                            </button>
                        );
                      })}
                    </div>
                ) : (
                    <p className="rounded-2xl border p-4 text-sm text-muted-foreground">
                      Груп не знайдено.
                    </p>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Конкретні студенти</p>
                  <p className="text-xs text-muted-foreground">
                    Відправка тільки обраним студентам.
                  </p>
                </div>

                {students.length ? (
                    <div className="grid gap-2">
                      {students.map((student) => {
                        const active = student.id
                            ? selectedUserIds.includes(student.id)
                            : false;

                        return (
                            <button
                                key={student.id}
                                type="button"
                                className={cn(
                                    "flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-colors",
                                    active
                                        ? "border-primary bg-primary/10"
                                        : "bg-background hover:bg-muted"
                                )}
                                onClick={() => {
                                  if (!student.id) return;

                                  setSelectedUserIds((prev) =>
                                      prev.includes(student.id!)
                                          ? prev.filter((id) => id !== student.id)
                                          : [...prev, student.id!]
                                  );
                                }}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {student.full_name || "Немає"}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {student.email || "Немає"}
                                </p>
                              </div>

                              {active ? (
                                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                              ) : null}
                            </button>
                        );
                      })}
                    </div>
                ) : (
                    <p className="rounded-2xl border p-4 text-sm text-muted-foreground">
                      Студентів не знайдено.
                    </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Файли</label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed bg-muted/20 p-6 text-center transition-colors hover:bg-muted/40">
                  <FileText className="mb-2 h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                  Натисніть, щоб обрати файли
                </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                  Максимум 10 файлів
                </span>
                  <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        setBroadcastFiles(
                            Array.from(event.target.files ?? []).slice(0, 10)
                        );
                      }}
                  />
                </label>

                {broadcastFiles.length ? (
                    <div className="space-y-2">
                      {broadcastFiles.map((file) => (
                          <div
                              key={`${file.name}-${file.size}`}
                              className="flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>

                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setBroadcastFiles((prev) =>
                                      prev.filter(
                                          (item) =>
                                              !(
                                                  item.name === file.name &&
                                                  item.size === file.size
                                              )
                                      )
                                  );
                                }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                      ))}
                    </div>
                ) : null}
              </div>

              <div className="rounded-3xl border bg-muted/30 p-4">
                <p className="font-medium">Підсумок</p>

                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Ролі</span>
                    <span className="text-right font-medium">
                    {selectedRoleSlugs.length
                        ? selectedRoleSlugs.join(", ")
                        : "Немає"}
                  </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Групи</span>
                    <span className="text-right font-medium">
                    {selectedGroups.length
                        ? selectedGroups
                            .map((group) => group.name || "Немає")
                            .join(", ")
                        : "Немає"}
                  </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Студенти</span>
                    <span className="text-right font-medium">
                    {selectedStudents.length
                        ? selectedStudents
                            .map((student) => student.full_name || "Немає")
                            .join(", ")
                        : "Немає"}
                  </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Файли</span>
                    <span className="font-medium">{broadcastFiles.length}</span>
                  </div>
                </div>
              </div>

              <Button
                  type="button"
                  className="w-full gap-2"
                  disabled={
                      isSending ||
                      !broadcastMessage.trim() ||
                      (!selectedRoleSlugs.length &&
                          !selectedGroupIds.length &&
                          !selectedUserIds.length)
                  }
                  onClick={handleSendBroadcast}
              >
                {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
                Надіслати розсилку
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
  );
}