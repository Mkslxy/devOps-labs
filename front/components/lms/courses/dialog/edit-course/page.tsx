"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CourseForm } from "@/components/lms/form/CourseForm";
import { useUpdateCourseMutation } from "@/store/groups/group.api";
import type { CoursePayload } from "@/store/groups/group.type";

interface Props {
  course: any;
}

export function EditCourseDialog({ course }: Props) {
  const [open, setOpen] = useState(false);
  const [updateCourse, { isLoading }] = useUpdateCourseMutation();
  const [form, setForm] = useState<CoursePayload>({
    title: "",
    description: "",
    subject_id: 0,
    price: "",
    level: "",
    is_active: false,
  });

  useEffect(() => {
    if (!course) return;

    setForm({
      title: course.title ?? "",
      description: course.description ?? "",
      subject_id: course.subject_id ?? course.subject?.id ?? course.subject ?? 0,
      price: String(course.price ?? ""),
      level: course.level ?? "",
      is_active: Boolean(course.is_active),
    });
  }, [course]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={(event) => event.stopPropagation()} className="w-[100px]" variant="outline">
          Редагувати
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редагувати курс</DialogTitle>
        </DialogHeader>

        <CourseForm
          value={form}
          onChange={setForm}
          submitLabel="Зберегти"
          loading={isLoading}
          onCancel={() => setOpen(false)}
          onSubmit={async () => {
            await updateCourse({ id: course.id, data: form }).unwrap();
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
