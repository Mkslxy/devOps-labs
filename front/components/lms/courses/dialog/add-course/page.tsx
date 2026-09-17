"use client";

import { useState } from "react";

import { CourseForm } from "@/components/lms/form/CourseForm";
import { useCreateCourseMutation } from "@/store/groups/group.api";
import type { CoursePayload } from "@/store/groups/group.type";

interface Props {
  onSuccess?: () => void;
}

export default function CreateCourseForm({ onSuccess }: Props) {
  const [createCourse, { isLoading }] = useCreateCourseMutation();
  const [form, setForm] = useState<CoursePayload>({
    title: "",
    description: "",
    subject_id: 0,
    price: "",
    level: "",
    is_active: false,
  });

  return (
    <CourseForm
      value={form}
      onChange={setForm}
      submitLabel="Створити"
      onCancel={() => onSuccess?.()}
      loading={isLoading}
      onSubmit={async () => {
        await createCourse(form).unwrap();
        onSuccess?.();
      }}
    />
  );
}
