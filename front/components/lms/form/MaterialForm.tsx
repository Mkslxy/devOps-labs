"use client";

import { useEffect, useMemo, useState } from "react";

import TopicPicker from "@/components/lms/courses/card/TopicPicker";
import { Button } from "@/components/ui/button";
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
import { MATERIAL_LABELS } from "@/store/material/material.labels";
import type { AccessLevelEnum, Material, MaterialPayload } from "@/store/material/material.type";

type ExistingLink = {
  id: number;
  url: string;
  name: string;
  is_video_embed: boolean;
};

type LinkDraft = {
  url: string;
  name: string;
  is_video_embed: boolean;
};

type MaterialFormErrors = FieldErrors<"title" | "topic" | "api">;

interface Props {
  initial?: Material;
  onSubmit: (payload: MaterialPayload) => Promise<void>;
  onCancel?: () => void;
  submitText?: string;
}

export default function MaterialForm({ initial, onSubmit, onCancel, submitText }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [accessLevel, setAccessLevel] = useState<AccessLevelEnum>(
    (initial?.access_level as AccessLevelEnum) ?? ("public" as AccessLevelEnum)
  );
  const [topicId, setTopicId] = useState<number | null>(initial?.topic ?? null);
  const [errors, setErrors] = useState<MaterialFormErrors>({});

  const [existingLinks, setExistingLinks] = useState<ExistingLink[]>(
    (initial?.links ?? []).map((link) => ({
      id: link.id,
      url: link.url,
      name: link.name,
      is_video_embed: link.is_video_embed,
    }))
  );

  const [newLinks, setNewLinks] = useState<LinkDraft[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);
  const [deletedLinkIds, setDeletedLinkIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!initial) return;

    setTitle(initial.title ?? "");
    setDescription(initial.description ?? "");
    setAccessLevel((initial.access_level as AccessLevelEnum) ?? ("public" as AccessLevelEnum));
    setTopicId(initial.topic ?? null);
    setErrors({});

    setExistingLinks(
      (initial.links ?? []).map((link) => ({
        id: link.id,
        url: link.url,
        name: link.name,
        is_video_embed: link.is_video_embed,
      }))
    );

    setNewLinks([]);
    setDeletedFileIds([]);
    setDeletedLinkIds([]);
    setUploadedFiles([]);
  }, [initial]);

  const linksJson = useMemo(
    () => JSON.stringify(newLinks.filter((link) => link.url.trim())),
    [newLinks]
  );

  const removeExistingFile = (fileId: number) => {
    setDeletedFileIds((previous) => (previous.includes(fileId) ? previous : [...previous, fileId]));
  };

  const undoRemoveExistingFile = (fileId: number) => {
    setDeletedFileIds((previous) => previous.filter((id) => id !== fileId));
  };

  const removeExistingLink = (linkId: number) => {
    setDeletedLinkIds((previous) => (previous.includes(linkId) ? previous : [...previous, linkId]));
  };

  const undoRemoveExistingLink = (linkId: number) => {
    setDeletedLinkIds((previous) => previous.filter((id) => id !== linkId));
  };

  const addLink = () => {
    setNewLinks((previous) => [...previous, { url: "", name: "", is_video_embed: false }]);
  };

  const updateLink = (index: number, patch: Partial<LinkDraft>) => {
    setNewLinks((previous) =>
      previous.map((link, currentIndex) => (currentIndex === index ? { ...link, ...patch } : link))
    );
  };

  const deleteLinkDraft = (index: number) => {
    setNewLinks((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const validate = () => {
    const nextErrors: MaterialFormErrors = validateRequiredFields([
      { key: "title", label: "Назва", value: title },
      { key: "topic", label: "Тема", value: topicId },
    ]);

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload: MaterialPayload = {
        title: title.trim(),
        description,
        access_level: accessLevel,
        topic: topicId ?? undefined,
        uploaded_files: uploadedFiles.length ? uploadedFiles : undefined,
        deleted_file_ids: deletedFileIds.length ? deletedFileIds : undefined,
        links_json: newLinks.length ? linksJson : undefined,
        deleted_link_ids: deletedLinkIds.length ? deletedLinkIds : undefined,
      };

      await onSubmit(payload);
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        api: formatApiError(error, "Не вдалося зберегти матеріал."),
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid w-full max-w-7xl grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form onSubmit={submit} className="max-w-4xl space-y-8 rounded-2xl border bg-background p-8 shadow-sm">
        {errors.api ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errors.api}
          </div>
        ) : null}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Основна інформація</h2>

          <div className="space-y-2" data-field-root>
            <RequiredLabel required className="text-sm text-muted-foreground">
              Назва
            </RequiredLabel>
            <Input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setErrors((previous) => ({ ...previous, title: undefined, api: undefined }));
              }}
              placeholder="Напр. Present Simple"
              aria-invalid={!!errors.title}
            />
            {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
          </div>

          <div className="space-y-2">
            <RequiredLabel className="text-sm text-muted-foreground">Опис</RequiredLabel>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Короткий опис матеріалу"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <RequiredLabel className="text-sm text-muted-foreground">Рівень доступу</RequiredLabel>
            <Select value={accessLevel} onValueChange={(value) => setAccessLevel(value as AccessLevelEnum)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MATERIAL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {initial?.files?.length ? (
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Файли</h3>
            <div className="space-y-2">
              {initial.files.map((file) => {
                const marked = deletedFileIds.includes(file.id);
                return (
                  <div key={file.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                    <a
                      className={`text-sm underline ${marked ? "opacity-50" : ""}`}
                      href={file.file}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {file.name}
                    </a>

                    {marked ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => undoRemoveExistingFile(file.id)}>
                        Скасувати
                      </Button>
                    ) : (
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeExistingFile(file.id)}>
                        Видалити
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Файли видаляться після збереження змін.</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <RequiredLabel className="text-sm text-muted-foreground">Додати файли</RequiredLabel>
          <input type="file" multiple onChange={(event) => setUploadedFiles(Array.from(event.target.files ?? []))} />
          {uploadedFiles.length ? (
            <div className="text-xs text-muted-foreground">Обрано файлів: {uploadedFiles.length}</div>
          ) : null}
        </div>

        {existingLinks.length ? (
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Поточні посилання</h3>
            <div className="space-y-2">
              {existingLinks.map((link) => {
                const marked = deletedLinkIds.includes(link.id);
                return (
                  <div key={link.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                    <a
                      className={`text-sm underline ${marked ? "opacity-50" : ""}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {link.name}
                    </a>

                    {marked ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => undoRemoveExistingLink(link.id)}>
                        Повернути
                      </Button>
                    ) : (
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeExistingLink(link.id)}>
                        Видалити
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Посилання видаляться після збереження змін.</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">Посилання</h3>
            <Button type="button" variant="outline" onClick={addLink}>
              + Додати посилання
            </Button>
          </div>

          <div className="space-y-3">
            {newLinks.map((link, index) => (
              <div key={index} className="space-y-2 rounded-md border p-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Input
                    value={link.name}
                    onChange={(event) => updateLink(index, { name: event.target.value })}
                    placeholder="Назва"
                  />
                  <Input
                    value={link.url}
                    onChange={(event) => updateLink(index, { url: event.target.value })}
                    placeholder="URL"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={link.is_video_embed}
                      onChange={(event) => updateLink(index, { is_video_embed: event.target.checked })}
                    />
                    Відео embed
                  </label>

                  <Button type="button" variant="destructive" size="sm" onClick={() => deleteLinkDraft(index)}>
                    Прибрати
                  </Button>
                </div>
              </div>
            ))}

            {!newLinks.length ? (
              <div className="text-sm text-muted-foreground">
                Немає посилань. Натисніть "Додати посилання", щоб створити нове.
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Скасувати
            </Button>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Збереження..." : submitText ?? (initial ? "Зберегти" : "Створити")}
          </Button>
        </div>
      </form>

      <div className="sticky top-6 h-fit rounded-2xl border bg-muted/20 p-5">
        <div className="space-y-4" data-field-root>
          <div className="space-y-1">
            <RequiredLabel required className="text-base font-semibold">
              Тема
            </RequiredLabel>
            <p className="text-xs text-muted-foreground">Оберіть тему для матеріалу</p>
          </div>

          <div className={errors.topic ? "rounded-xl border border-destructive p-2" : ""}>
            <TopicPicker
              value={topicId}
              onChange={(value) => {
                setTopicId(value);
                setErrors((previous) => ({ ...previous, topic: undefined, api: undefined }));
              }}
            />
          </div>
          {errors.topic ? <p className="text-sm text-destructive">{errors.topic}</p> : null}
        </div>
      </div>
    </div>
  );
}
