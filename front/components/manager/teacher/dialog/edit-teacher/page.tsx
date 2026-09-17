"use client";

import React, { ReactNode, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdateTeacherMutation } from "@/store/users/user.api";
import { Form } from "@/components/manager/form/Form";
import type { UserFormData } from "@/store/users/user.type";

interface Props {
  teacher: any;
  trigger?: ReactNode;
}

export function EditTeacherDialog({ teacher, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [updateTeacher, { isLoading }] = useUpdateTeacherMutation();

  const [form, setForm] = useState<UserFormData>({
    full_name: "",
    email: "",
    phone_country_code: "+380",
    phone_national_number: "",
    date_of_birth: "",
    city: "",
    school_ids: [],
  });

  useEffect(() => {
    if (!teacher) return;

    setForm({
      full_name: teacher.full_name || "",
      email: teacher.email || "",
      phone_country_code: teacher.phone_country_code || "+380",
      phone_national_number: teacher.phone_national_number || "",
      date_of_birth: teacher.date_of_birth || "",
      city: teacher.city || "",
      school_ids: Array.isArray(teacher.school_ids)
        ? teacher.school_ids
        : Array.isArray(teacher.schools)
          ? teacher.schools
              .map((school: any) => (typeof school === "number" ? school : school.id))
              .filter(Boolean)
          : teacher.school?.id
            ? [teacher.school.id]
            : [],
    });
  }, [teacher]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            onClick={(event) => event.stopPropagation()}
            className="w-[90px] cursor-pointer 2xl:w-[111px]"
            variant="outline"
          >
            Редагувати
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редагувати викладача</DialogTitle>
        </DialogHeader>

        <Form
          value={form}
          onChange={setForm}
          submitLabel="Зберегти"
          loading={isLoading}
          onSubmit={async () => {
            await updateTeacher({
              id: teacher.id,
              data: form,
            }).unwrap();

            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
