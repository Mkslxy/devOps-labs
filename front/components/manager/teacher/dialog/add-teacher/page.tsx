"use client";

import React, { useState } from "react";
import { useGetRolesQuery, useCreateTeacherMutation } from "@/store/users/user.api";
import { Form } from "@/components/manager/form/Form";
import type { UserFormData } from "@/store/users/user.type";

interface Props {
  onSuccess?: () => void;
}

export default function CreateTeacherForm({ onSuccess }: Props) {
  const { data: rolesData, isLoading } = useGetRolesQuery();
  const [createTeacher, { isLoading: isCreating }] = useCreateTeacherMutation();

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

  const teacherRole = rolesData?.results.find((role: { slug: string }) => role.slug === "teacher");
  if (!teacherRole) return <div>Роль викладача не знайдено</div>;

  return (
    <Form
      value={form}
      onChange={setForm}
      submitLabel="Створити"
      loading={isCreating}
      onSubmit={async () => {
        await createTeacher({
          ...form,
          role_id: teacherRole.id,
        }).unwrap();
        onSuccess?.();
      }}
    />
  );
}
