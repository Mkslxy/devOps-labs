"use client";

import React, { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import { formatApiError, requiredMessage } from "@/libs/form-validation";
import { useCreateSubjectMutation } from "@/store/subject/subject.api";

interface CreateSubjectFormProps {
  onSuccess?: () => void;
}

export default function CreateSubjectForm({ onSuccess }: CreateSubjectFormProps) {
  const [name, setName] = useState("");
  const [errorText, setErrorText] = useState("");
  const [createSubject, { isLoading }] = useCreateSubjectMutation();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setErrorText(requiredMessage("Назва предмета"));
      return;
    }

    try {
      setErrorText("");
      await createSubject({ name: name.trim() }).unwrap();
      setName("");
      onSuccess?.();
    } catch (error) {
      setErrorText(formatApiError(error, "Не вдалося створити предмет."));
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
          placeholder="Наприклад: Англійська мова"
          aria-invalid={!!errorText && !name.trim()}
        />
      </div>

      {errorText ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {errorText}
        </div>
      ) : null}

      <Button type="submit" disabled={isLoading} className="w-full cursor-pointer">
        {isLoading ? "Створення..." : "Створити"}
      </Button>
    </form>
  );
}
