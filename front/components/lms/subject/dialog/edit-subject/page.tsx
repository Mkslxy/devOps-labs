"use client";

import React, { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import { formatApiError, requiredMessage } from "@/libs/form-validation";
import { useUpdateSubjectMutation } from "@/store/subject/subject.api";
import type { Subject } from "@/store/subject/subject.type";

interface EditSubjectFormProps {
  subject: Subject;
  onSuccess?: () => void;
}

export default function EditSubjectForm({ subject, onSuccess }: EditSubjectFormProps) {
  const [name, setName] = useState(subject.name || "");
  const [errorText, setErrorText] = useState("");
  const [updateSubject, { isLoading }] = useUpdateSubjectMutation();

  useEffect(() => {
    setName(subject.name || "");
    setErrorText("");
  }, [subject]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setErrorText(requiredMessage("Назва предмета"));
      return;
    }

    try {
      setErrorText("");
      await updateSubject({
        id: subject.id,
        data: { name: name.trim() },
      }).unwrap();
      onSuccess?.();
    } catch (error) {
      setErrorText(formatApiError(error, "Не вдалося оновити предмет."));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2" data-field-root>
        <RequiredLabel required>Назва предмета</RequiredLabel>
        <Input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setErrorText("");
          }}
          placeholder="Назва предмета"
          aria-invalid={!!errorText && !name.trim()}
        />
      </div>

      {errorText ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {errorText}
        </div>
      ) : null}

      <Button type="submit" disabled={isLoading} className="w-full cursor-pointer">
        {isLoading ? "Збереження..." : "Зберегти"}
      </Button>
    </form>
  );
}
