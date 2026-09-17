"use client";

import React, { useState } from "react";
import { useGetRolesQuery, useCreateStudentMutation } from "@/store/users/user.api";
import { Form } from "@/components/manager/form/Form";
import type { UserFormData } from "@/store/users/user.type";

interface Props {
  onSuccess?: () => void;
}

export default function CreateStudentForm({ onSuccess }: Props) {
  const { data: rolesData, isLoading } = useGetRolesQuery();
  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation();

  const [form, setForm] = useState<UserFormData>({
    full_name: "",
    email: "",
    phone_country_code: "+380",
    phone_national_number: "",
    date_of_birth: "",
    city: "",
    school_ids: [],
  });

  if (isLoading) return <div>Завантаження...</div>;

  const studentRole = rolesData?.results.find((role: { slug: string }) => role.slug === "student");
  if (!studentRole) return <div>Роль студента не знайдено</div>;

  return (
    <Form
      value={form}
      onChange={setForm}
      submitLabel="Створити"
      loading={isCreating}
      onSubmit={async () => {
        await createStudent({
          ...form,
          role_id: studentRole.id,
        }).unwrap();
        onSuccess?.();
      }}
    />
  );
}
