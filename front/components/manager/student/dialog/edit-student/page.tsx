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
import { useUpdateStudentMutation } from "@/store/users/user.api";
import { Form } from "@/components/manager/form/Form";
import type { UserFormData } from "@/store/users/user.type";

interface Props {
  student: any;
  trigger?: ReactNode;
}

export function EditStudentDialog({ student, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [updateStudent, { isLoading }] = useUpdateStudentMutation();

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
    if (!student) return;

    setForm({
      full_name: student.full_name || "",
      email: student.email || "",
      phone_country_code: student.phone_country_code || "+380",
      phone_national_number: student.phone_national_number || "",
      date_of_birth: student.date_of_birth || "",
      city: student.city || "",
      school_ids: Array.isArray(student.school_ids)
        ? student.school_ids
        : Array.isArray(student.schools)
          ? student.schools
              .map((school: any) => (typeof school === "number" ? school : school.id))
              .filter(Boolean)
          : student.school?.id
            ? [student.school.id]
            : [],
    });
  }, [student]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            onClick={(event) => event.stopPropagation()}
            className="w-[90px] cursor-pointer 2xl:w-[100px]"
            variant="outline"
          >
            Редагувати
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редагувати студента</DialogTitle>
        </DialogHeader>

        <Form
          value={form}
          onChange={setForm}
          submitLabel="Зберегти"
          loading={isLoading}
          onSubmit={async () => {
            await updateStudent({
              id: student.id,
              data: form,
            }).unwrap();

            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
