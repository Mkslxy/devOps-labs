import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, X, FileText, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatApiError, validateRequiredFields, type FieldErrors } from "@/libs/form-validation";
import { useGetTopicsQuery } from "@/store/topic/topic.api";
import type { Task } from "@/store/task-default/task-default.type";

type LinkDraft = { id?: number; url: string; name: string; is_video_embed: boolean };

type Props = {
  mode: "create" | "edit";
  initial?: Task;
  isLoading?: boolean;
  onCancel: () => void;
  onSubmit: (fd: FormData) => Promise<void>;
};

type TaskFormErrors = FieldErrors<"title" | "topic" | "deadline" | "api">;

function safeText(value?: string | null) {
  const text = (value ?? "").trim();
  return text ? text : "Немає";
}

function pickFileUrl(file: any): string | null {
  return file?.url ?? file?.file ?? file?.file_url ?? file?.download_url ?? file?.path ?? null;
}

function pickFileName(file: any, fallback = "Немає"): string {
  const name = file?.name ?? file?.filename ?? file?.original_name ?? file?.title ?? null;
  if (typeof name === "string" && name.trim()) return name.trim();

  const url = pickFileUrl(file);
  if (url) {
    const tail = String(url).split("/").pop();
    if (tail) return tail;
  }

  return fallback;
}

export function TaskForm({ mode, initial, isLoading, onCancel, onSubmit }: Props) {
  const isEdit = mode === "edit";
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState<string>("");
  const [topicId, setTopicId] = useState<number | null>(null);
  const [errors, setErrors] = useState<TaskFormErrors>({});

  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);

  const [links, setLinks] = useState<LinkDraft[]>([]);
  const [deletedLinkIds, setDeletedLinkIds] = useState<number[]>([]);

  const { data: topicsData } = useGetTopicsQuery({ page: 1, page_size: 200, ordering: "id" } as any);
  const topics = topicsData?.results ?? [];

  const serverFiles = useMemo(() => {
    const raw = (initial as any)?.files ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [initial]);

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setDeadline((initial as any)?.deadline ?? "");
    setTopicId(initial?.topic?.id ?? (initial as any)?.topic_id ?? null);
    setErrors({});

    setLocalFiles([]);
    setDeletedFileIds([]);

    const baseLinks = ((initial as any)?.links ?? []) as any[];
    setLinks(
      baseLinks.map((link) => ({
        id: link.id,
        url: link.url ?? "",
        name: link.name ?? "",
        is_video_embed: Boolean(link.is_video_embed),
      }))
    );
    setDeletedLinkIds([]);
  }, [initial]);

  const onPickFiles = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  const onFilesSelected = (files: FileList | null) => {
    const next = Array.from(files ?? []);
    if (!next.length) return;

    setLocalFiles((previous) => {
      const map = new Map<string, File>();
      for (const file of previous) map.set(`${file.name}-${file.size}`, file);
      for (const file of next) map.set(`${file.name}-${file.size}`, file);
      return Array.from(map.values());
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeLocalFile = (file: File) => {
    setLocalFiles((previous) =>
      previous.filter((current) => !(current.name === file.name && current.size === file.size))
    );
  };

  const toggleDeleteServerFile = (id?: number) => {
    if (typeof id !== "number") return;
    setDeletedFileIds((previous) =>
      previous.includes(id) ? previous.filter((current) => current !== id) : [...previous, id]
    );
  };

  const addLink = () =>
    setLinks((previous) => [...previous, { url: "", name: "", is_video_embed: false }]);

  const updateLink = (index: number, patch: Partial<LinkDraft>) => {
    setLinks((previous) =>
      previous.map((link, currentIndex) => (currentIndex === index ? { ...link, ...patch } : link))
    );
  };

  const removeLink = (index: number) => {
    const link = links[index];
    if (link?.id) {
      setDeletedLinkIds((previous) => (previous.includes(link.id!) ? previous : [...previous, link.id!]));
    }
    setLinks((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const validate = () => {
    const nextErrors: TaskFormErrors = validateRequiredFields([
      { key: "title", label: "Назва", value: title },
      { key: "topic", label: "Тема", value: topicId },
    ]);

    if (deadline) {
      const date = String(deadline).slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      if (date < today) {
        nextErrors.deadline = "Дедлайн не може бути у минулому.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildFormData = () => {
    const fd = new FormData();

    fd.append("title", title.trim());
    if (description.trim()) fd.append("description", description.trim());
    if (deadline) fd.append("deadline", String(deadline).slice(0, 10));
    if (topicId) fd.append("topic_id", String(topicId));

    for (const file of localFiles) fd.append("uploaded_files", file);
    for (const id of deletedFileIds) fd.append("deleted_file_ids", String(id));
    for (const id of deletedLinkIds) fd.append("deleted_link_ids", String(id));

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

    return fd;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      if (deadline && errors.deadline) {
        toast({
          title: "Некоректний дедлайн",
          description: errors.deadline,
          variant: "destructive",
        });
      }
      return;
    }

    try {
      await onSubmit(buildFormData());
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        api: formatApiError(error, "Не вдалося зберегти завдання."),
      }));
    }
  };

  const clearTopic = () => {
    setTopicId(null);
    setErrors((previous) => ({ ...previous, topic: undefined, api: undefined }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? "Редагування завдання" : "Нове завдання"}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {errors.api ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {errors.api}
              </div>
            ) : null}

            <div className="space-y-2" data-field-root>
              <RequiredLabel required>Назва</RequiredLabel>
              <Input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setErrors((previous) => ({ ...previous, title: undefined, api: undefined }));
                }}
                placeholder="Введіть назву"
                aria-invalid={!!errors.title}
              />
              {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
            </div>

            <div className="space-y-2" data-field-root>
              <RequiredLabel>Дедлайн</RequiredLabel>
              <Input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={deadline ? String(deadline).slice(0, 10) : ""}
                onChange={(event) => {
                  setDeadline(event.target.value);
                  setErrors((previous) => ({ ...previous, deadline: undefined, api: undefined }));
                }}
                aria-invalid={!!errors.deadline}
              />
              {errors.deadline ? <p className="text-sm text-destructive">{errors.deadline}</p> : null}
            </div>

            <div className="space-y-2">
              <RequiredLabel>Опис</RequiredLabel>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Введіть опис"
                className="min-h-[160px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-0">
            <CardTitle>Файли</CardTitle>
            <div className="flex w-full md:w-auto md:justify-end">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={(event) => onFilesSelected(event.target.files)}
                disabled={isLoading}
              />

              <Button
                type="button"
                variant="outline"
                className="w-full cursor-pointer md:w-auto"
                onClick={onPickFiles}
                disabled={isLoading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Додати файл
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {isEdit && serverFiles.length ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Вже прикріплено</div>
                <div className="flex flex-wrap gap-2">
                  {serverFiles.map((file: any, index: number) => {
                    const id = file?.id as number | undefined;
                    const name = pickFileName(file, `Файл ${index + 1}`);
                    const url = pickFileUrl(file);
                    const marked = typeof id === "number" ? deletedFileIds.includes(id) : false;

                    return (
                      <Badge
                        key={id ?? url ?? `${name}-${index}`}
                        variant={marked ? "destructive" : "secondary"}
                        className="gap-2"
                      >
                        <FileText className="h-3 w-3" />
                        <span className="max-w-[260px] truncate">{safeText(name)}</span>

                        {typeof id === "number" ? (
                          <button
                            type="button"
                            className="ml-1 inline-flex items-center rounded-full hover:opacity-80"
                            onClick={() => toggleDeleteServerFile(id)}
                            disabled={isLoading}
                            title={marked ? "Позначено на видалення" : "Позначити на видалення"}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        ) : null}
                      </Badge>
                    );
                  })}
                </div>

                {deletedFileIds.length ? (
                  <div className="text-xs text-muted-foreground">
                    Позначено на видалення: <span className="font-medium">{deletedFileIds.length}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {localFiles.length ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Обрано до завантаження</div>
                <div className="space-y-2">
                  {localFiles.map((file) => (
                    <div
                      key={`${file.name}-${file.size}`}
                      className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} КБ</div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        className="cursor-pointer"
                        onClick={() => removeLocalFile(file)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col justify-between gap-3 md:flex-row md:items-center md:gap-0">
            <CardTitle>Посилання</CardTitle>

            <Button
              type="button"
              variant="outline"
              className="w-full cursor-pointer md:w-auto"
              onClick={addLink}
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Додати
            </Button>
          </CardHeader>

          <CardContent className="space-y-3">
            {links.length ? (
              links.map((link, index) => (
                <Card key={`${link.id ?? "new"}-${index}`} className="border">
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <RequiredLabel>URL</RequiredLabel>
                        <Input
                          value={link.url}
                          onChange={(event) => updateLink(index, { url: event.target.value })}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="space-y-2">
                        <RequiredLabel>Назва</RequiredLabel>
                        <Input
                          value={link.name}
                          onChange={(event) => updateLink(index, { name: event.target.value })}
                          placeholder="Назва"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex rounded-xl border bg-background p-1">
                        <Button
                          type="button"
                          className="h-9 cursor-pointer rounded-lg px-3"
                          variant={!link.is_video_embed ? "secondary" : "ghost"}
                          onClick={() => updateLink(index, { is_video_embed: false })}
                          disabled={isLoading}
                        >
                          Звичайне
                        </Button>
                        <Button
                          type="button"
                          className="h-9 cursor-pointer rounded-lg px-3"
                          variant={link.is_video_embed ? "secondary" : "ghost"}
                          onClick={() => updateLink(index, { is_video_embed: true })}
                          disabled={isLoading}
                        >
                          Відео
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full cursor-pointer md:w-auto"
                        onClick={() => removeLink(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Прибрати
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Посилання ще не додані.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Прив'язки</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2" data-field-root>
            <div className="flex items-center justify-between gap-2">
              <RequiredLabel required>Тема</RequiredLabel>
              <button type="button" className="text-sm text-muted-foreground hover:underline" onClick={clearTopic}>
                Очистити
              </button>
            </div>

            <Select
              value={topicId ? String(topicId) : ""}
              onValueChange={(value) => {
                setTopicId(Number(value));
                setErrors((previous) => ({ ...previous, topic: undefined, api: undefined }));
              }}
            >
              <SelectTrigger className="w-full" aria-invalid={!!errors.topic}>
                <SelectValue placeholder="Оберіть тему" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[9999] max-h-60 overflow-y-auto">
                {topics.map((topic: any) => (
                  <SelectItem key={topic.id} value={String(topic.id)}>
                    {topic.title || "Немає"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.topic ? <p className="text-sm text-destructive">{errors.topic}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Дії</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Перевірте дані перед збереженням.</div>

            <Button className="w-full cursor-pointer" disabled={isLoading} onClick={handleSubmit}>
              {isEdit ? "Зберегти" : "Створити"}
            </Button>

            <Button className="w-full cursor-pointer" variant="outline" disabled={isLoading} onClick={onCancel}>
              Скасувати
            </Button>

            {errors.title || errors.topic ? (
              <div className="text-xs text-destructive">Заповніть обов'язкові поля: Назва, Тема.</div>
            ) : (
              <div className="text-xs text-muted-foreground">Обов'язкові поля позначені зірочкою.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
