import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FileUp, Link as LinkIcon, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
import { formatApiError } from "@/libs/form-validation";
import { useGetGroupsQuery } from "@/store/groups/group.api";
import type { Group } from "@/store/groups/group.type";
import { useGetAllLessonsQuery } from "@/store/lessons/lesson.api";
import type { Lesson } from "@/store/lessons/lesson.type";
import type { Homework, HomeworkPayload } from "@/store/homework/homework.type";
import { useGetStudentsQuery } from "@/store/users/user.api";
import type { UserFormData } from "@/store/users/user.type";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  initial?: Homework;
  isLoading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: FormData) => Promise<void>;
};

type LinkDraft = {
  id?: number;
  url: string;
  name: string;
  is_video_embed: boolean;
};

export function HomeworkForm({ mode, initial, isLoading, onCancel, onSubmit }: Props) {
  const { data: groupsData } = useGetGroupsQuery({ page_size: 50 });
  const { data: lessonsData } = useGetAllLessonsQuery({ page: 1, page_size: 50 } as any);
  const { data: studentsData } = useGetStudentsQuery({ page: 1, page_size: 50 } as any);

  const groups = useMemo<Group[]>(() => groupsData?.results ?? [], [groupsData]);
  const lessons = useMemo<Lesson[]>(() => (lessonsData as any)?.results ?? [], [lessonsData]);
  const students = useMemo<UserFormData[]>(() => (studentsData as any)?.results ?? [], [studentsData]);

  const form = useForm<HomeworkPayload>({
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      deadline: initial?.deadline ?? "",
      group_id: initial?.group?.id ?? undefined,
      lesson_id: initial?.lesson?.id ?? undefined,
      student_id: initial?.student?.id ?? undefined,
      uploaded_files: [],
      deleted_file_ids: [],
      links_json: [],
      delete_link_ids: [],
    },
    mode: "onSubmit",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = form;

  useEffect(() => {
    reset({
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      deadline: initial?.deadline ?? "",
      group_id: initial?.group?.id ?? undefined,
      lesson_id: initial?.lesson?.id ?? undefined,
      student_id: initial?.student?.id ?? undefined,
      uploaded_files: [],
      deleted_file_ids: [],
      links_json: [],
      delete_link_ids: [],
    });
    setScopeError("");
    setApiError("");
  }, [initial, reset]);

  const title = watch("title");
  const deadline = watch("deadline");
  const groupId = watch("group_id");
  const lessonId = watch("lesson_id");
  const studentId = watch("student_id");
  const uploadedFiles = watch("uploaded_files") ?? [];
  const deletedFileIds = watch("deleted_file_ids") ?? [];
  const deleteLinkIds = watch("delete_link_ids") ?? [];

  const initialFiles = initial?.files ?? [];
  const filePickerRef = useRef<HTMLInputElement | null>(null);
  const [fileInput, setFileInput] = useState("");
  const [pickedFiles, setPickedFiles] = useState<File[]>([]);
  const [scopeError, setScopeError] = useState("");
  const [apiError, setApiError] = useState("");

  const [links, setLinks] = useState<LinkDraft[]>(() =>
    (initial?.links ?? []).map((link) => ({
      id: link.id,
      url: link.url ?? "",
      name: link.name ?? "",
      is_video_embed: Boolean(link.is_video_embed),
    }))
  );

  useEffect(() => {
    setLinks(
      (initial?.links ?? []).map((link) => ({
        id: link.id,
        url: link.url ?? "",
        name: link.name ?? "",
        is_video_embed: Boolean(link.is_video_embed),
      }))
    );
    setPickedFiles([]);
  }, [initial]);

  const groupOptions = useMemo(
    () => groups.map((group) => ({ id: group.id ?? 0, label: group.name || "Немає" })).filter((option) => option.id),
    [groups]
  );

  const lessonOptions = useMemo(
    () =>
      lessons
        .map((lesson: any) => ({ id: lesson.id ?? 0, label: lesson.topic || lesson.title || "Немає" }))
        .filter((option) => option.id),
    [lessons]
  );

  const studentOptions = useMemo(
    () =>
      students
        .map((student: any) => ({
          id: student.id ?? 0,
          label: student.full_name || student.email || "Немає",
        }))
        .filter((option) => option.id),
    [students]
  );

  const addUploadedFile = () => {
    const value = fileInput.trim();
    if (!value) return;
    setValue("uploaded_files", [...uploadedFiles, value], { shouldDirty: true });
    setFileInput("");
  };

  const removeUploadedFile = (index: number) => {
    setValue(
      "uploaded_files",
      uploadedFiles.filter((_, currentIndex) => currentIndex !== index),
      { shouldDirty: true }
    );
  };

  const toggleDeleteExistingFile = (id: number) => {
    const next = deletedFileIds.includes(String(id))
      ? deletedFileIds.filter((current) => current !== String(id))
      : [...deletedFileIds, String(id)];
    setValue("deleted_file_ids", next, { shouldDirty: true });
  };

  const addLink = () => {
    setLinks((previous) => [...previous, { url: "", name: "", is_video_embed: false }]);
  };

  const updateLink = (index: number, patch: Partial<LinkDraft>) => {
    setLinks((previous) =>
      previous.map((link, currentIndex) => (currentIndex === index ? { ...link, ...patch } : link))
    );
  };

  const removeLink = (index: number) => {
    const link = links[index];
    if (link?.id) {
      const next = deleteLinkIds.includes(String(link.id))
        ? deleteLinkIds
        : [...deleteLinkIds, String(link.id)];
      setValue("delete_link_ids", next, { shouldDirty: true });
    }
    setLinks((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const hasGroup = Boolean(groupId);
  const hasLesson = Boolean(lessonId);
  const hasStudent = Boolean(studentId);
  const activeKey: "group" | "lesson" | "student" | null =
    hasGroup ? "group" : hasLesson ? "lesson" : hasStudent ? "student" : null;

  const clearGroup = () => {
    setValue("group_id", undefined, { shouldDirty: true });
    setScopeError("");
  };

  const clearLesson = () => {
    setValue("lesson_id", undefined, { shouldDirty: true });
    setScopeError("");
  };

  const clearStudent = () => {
    setValue("student_id", undefined, { shouldDirty: true });
    setScopeError("");
  };

  const selectOnly = (key: "group" | "lesson" | "student", value: string) => {
    const numericValue = Number(value);
    setScopeError("");
    setApiError("");

    if (key === "group") {
      setValue("group_id", numericValue, { shouldDirty: true });
      setValue("lesson_id", undefined, { shouldDirty: true });
      setValue("student_id", undefined, { shouldDirty: true });
      return;
    }

    if (key === "lesson") {
      setValue("lesson_id", numericValue, { shouldDirty: true });
      setValue("group_id", undefined, { shouldDirty: true });
      setValue("student_id", undefined, { shouldDirty: true });
      return;
    }

    setValue("student_id", numericValue, { shouldDirty: true });
    setValue("group_id", undefined, { shouldDirty: true });
    setValue("lesson_id", undefined, { shouldDirty: true });
  };

  const submit = handleSubmit(async (values) => {
    const scopeCount = [values.group_id, values.lesson_id, values.student_id].filter(Boolean).length;

    if (scopeCount === 0) {
      setScopeError('Оберіть привʼязку: групу, урок або студента.');
      return;
    }

    if (scopeCount > 1) {
      setScopeError("Домашнє завдання може бути прив'язане лише до одного об'єкта.");
      return;
    }

    if (!values.deadline) {
      setError("deadline", { type: "required", message: "Заповніть поле \"Дедлайн\"." });
      return;
    }

    const fd = new FormData();
    fd.append("title", values.title.trim());
    if (values.description) fd.append("description", values.description);
    fd.append("deadline", values.deadline);

    if (values.group_id) {
      fd.append("group_id", String(values.group_id));
      fd.append("lesson_id", "");
      fd.append("student_id", "");
    } else if (values.lesson_id) {
      fd.append("lesson_id", String(values.lesson_id));
      fd.append("group_id", "");
      fd.append("student_id", "");
    } else if (values.student_id) {
      fd.append("student_id", String(values.student_id));
      fd.append("group_id", "");
      fd.append("lesson_id", "");
    }

    (values.deleted_file_ids ?? []).forEach((id) => fd.append("deleted_file_ids", String(id)));
    fd.append(
      "links_json",
      JSON.stringify(
        links
          .filter((link) => link.url.trim())
          .map((link) => ({
            id: link.id,
            url: link.url.trim(),
            name: link.name?.trim() || undefined,
            is_video_embed: Boolean(link.is_video_embed),
          }))
      )
    );
    (values.delete_link_ids ?? []).forEach((id) => fd.append("delete_link_ids", String(id)));
    pickedFiles.forEach((file) => fd.append("uploaded_files", file));
    (values.uploaded_files ?? []).forEach((value) => fd.append("uploaded_files", value));

    try {
      setApiError("");
      await onSubmit(fd);
    } catch (error) {
      setApiError(formatApiError(error, "Не вдалося зберегти домашнє завдання."));
    }
  });

  const pageTitle =
    mode === "create" ? "Нове домашнє завдання" : "Редагування домашнього завдання";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xl font-semibold leading-none">{pageTitle}</div>
          <div className="text-sm text-muted-foreground">Заповніть поля та збережіть зміни</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              {apiError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {apiError}
                </div>
              ) : null}

              <div className="text-base font-semibold">Основне</div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2" data-field-root>
                  <RequiredLabel required>Назва</RequiredLabel>
                  <Input
                    {...register("title", { required: 'Заповніть поле "Назва".' })}
                    placeholder="Введіть назву"
                    aria-invalid={!!errors.title}
                  />
                  {errors.title?.message ? (
                    <div className="text-sm text-destructive">{errors.title.message}</div>
                  ) : null}
                </div>

                <div className="space-y-2" data-field-root>
                  <RequiredLabel required>Дедлайн</RequiredLabel>
                  <input type="hidden" {...register("deadline", { required: 'Заповніть поле "Дедлайн".' })} />
                  <DateTimePicker
                    value={deadline || null}
                    onChange={(value) => {
                      setValue("deadline", value || "", { shouldDirty: true, shouldValidate: true });
                      clearErrors("deadline");
                    }}
                    placeholder="Оберіть дату та час"
                  />
                  {errors.deadline?.message ? (
                    <div className="text-sm text-destructive">{errors.deadline.message}</div>
                  ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <RequiredLabel>Опис</RequiredLabel>
                  <Textarea
                    {...register("description")}
                    placeholder="Введіть опис"
                    className="min-h-[140px]"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-4">
              <div className="text-base font-semibold">Файли</div>

              {mode === "edit" && initialFiles.length ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Існуючі файли</div>
                  <div className="flex flex-col gap-2">
                    {initialFiles.map((file) => {
                      const checked = deletedFileIds.includes(String(file.id));
                      return (
                        <div
                          key={file.id}
                          className="flex flex-col justify-between gap-3 rounded-md border p-3 md:flex-row md:items-start"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="break-all font-medium">{file.name || file.file || "Немає"}</div>
                            <div className="break-all text-xs text-muted-foreground">{file.file || "Немає"}</div>
                          </div>

                          <Button
                            type="button"
                            variant={checked ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => toggleDeleteExistingFile(file.id)}
                            className="shrink-0"
                          >
                            {checked ? "Скасувати" : "Видалити"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => filePickerRef.current?.click()}
                    className="absolute top-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted"
                    aria-label="Обрати файл"
                  >
                    <FileUp className="h-4 w-4" />
                  </button>

                  <Input
                    value={fileInput}
                    onChange={(event) => setFileInput(event.target.value)}
                    placeholder="Вставте ідентифікатор або посилання на файл"
                    className="pl-9 pr-10"
                  />

                  <input
                    ref={filePickerRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const selected = Array.from(event.target.files ?? []);
                      if (!selected.length) return;
                      setPickedFiles((previous) => [...previous, ...selected]);
                      event.currentTarget.value = "";
                    }}
                  />
                </div>
                <Button type="button" onClick={addUploadedFile}>
                  Додати
                </Button>
              </div>

              {uploadedFiles.length ? (
                <div className="flex flex-col gap-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={`${file}-${index}`} className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <div className="break-all text-sm">{file || "Немає"}</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeUploadedFile(index)}
                        aria-label="Прибрати файл"
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              {pickedFiles.length ? (
                <div className="flex flex-col gap-2">
                  {pickedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <div className="break-all text-sm">{file.name}</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setPickedFiles((previous) => previous.filter((_, currentIndex) => currentIndex !== index))}
                        aria-label="Прибрати файл"
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-base font-semibold">Посилання</div>
                <Button type="button" variant="outline" onClick={addLink}>
                  <Plus className="mr-2 h-4 w-4" />
                  Додати
                </Button>
              </div>

              {links.length ? (
                <div className="space-y-3">
                  {links.map((link, index) => (
                    <div key={`${link.id ?? "new"}-${index}`} className="rounded-md border p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <RequiredLabel>URL</RequiredLabel>
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={link.url}
                              onChange={(event) => updateLink(index, { url: event.target.value })}
                              placeholder="https://..."
                              className="pl-9"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <RequiredLabel>Назва</RequiredLabel>
                          <Input
                            value={link.name}
                            onChange={(event) => updateLink(index, { name: event.target.value })}
                            placeholder="Назва"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 md:col-span-2">
                          <div className="inline-flex rounded-xl border bg-background p-1">
                            <Button
                              type="button"
                              className="h-9 cursor-pointer rounded-lg px-3"
                              variant={!link.is_video_embed ? "secondary" : "ghost"}
                              onClick={() => updateLink(index, { is_video_embed: false })}
                            >
                              Звичайне
                            </Button>

                            <Button
                              type="button"
                              className="h-9 cursor-pointer rounded-lg px-3"
                              variant={link.is_video_embed ? "secondary" : "ghost"}
                              onClick={() => updateLink(index, { is_video_embed: true })}
                            >
                              Відео
                            </Button>
                          </div>

                          <Button type="button" variant="outline" onClick={() => removeLink(index)}>
                            Прибрати
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <RequiredLabel required className="text-base font-semibold">
                Прив'язка
              </RequiredLabel>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <RequiredLabel>Група</RequiredLabel>
                    <Button type="button" variant="ghost" size="sm" onClick={clearGroup} disabled={!hasGroup || Boolean(isLoading)} className="h-8 px-2">
                      Очистити
                    </Button>
                  </div>

                  <Select value={groupId ? String(groupId) : ""} onValueChange={(value) => selectOnly("group", value)} disabled={(activeKey !== null && activeKey !== "group") || Boolean(isLoading)}>
                    <SelectTrigger className="w-full" aria-invalid={!!scopeError && !activeKey}>
                      <SelectValue placeholder="Оберіть групу" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[9999] max-h-60 overflow-y-auto">
                      {groupOptions.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <RequiredLabel>Урок</RequiredLabel>
                    <Button type="button" variant="ghost" size="sm" onClick={clearLesson} disabled={!hasLesson || Boolean(isLoading)} className="h-8 px-2">
                      Очистити
                    </Button>
                  </div>

                  <Select value={lessonId ? String(lessonId) : ""} onValueChange={(value) => selectOnly("lesson", value)} disabled={(activeKey !== null && activeKey !== "lesson") || Boolean(isLoading)}>
                    <SelectTrigger className="w-full" aria-invalid={!!scopeError && !activeKey}>
                      <SelectValue placeholder="Оберіть урок" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[9999] max-h-60 overflow-y-auto">
                      {lessonOptions.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <RequiredLabel>Студент</RequiredLabel>
                    <Button type="button" variant="ghost" size="sm" onClick={clearStudent} disabled={!hasStudent || Boolean(isLoading)} className="h-8 px-2">
                      Очистити
                    </Button>
                  </div>

                  <Select value={studentId ? String(studentId) : ""} onValueChange={(value) => selectOnly("student", value)} disabled={(activeKey !== null && activeKey !== "student") || Boolean(isLoading)}>
                    <SelectTrigger className="w-full" aria-invalid={!!scopeError && !activeKey}>
                      <SelectValue placeholder="Оберіть студента" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[9999] max-h-60 overflow-y-auto">
                      {studentOptions.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {scopeError ? <div className="text-sm text-destructive">{scopeError}</div> : null}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-2">
              <div className="text-base font-semibold">Дії</div>
              <div className="text-sm text-muted-foreground">Перевірте дані перед збереженням.</div>

              <div className="flex flex-col gap-2 pt-2">
                <Button type="button" onClick={submit} disabled={Boolean(isLoading)}>
                  {mode === "create" ? "Створити" : "Зберегти"}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} disabled={Boolean(isLoading)}>
                  Скасувати
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
