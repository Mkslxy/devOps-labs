"use client";

import { useState } from "react";

import ModuleForm from "@/components/lms/form/ModuleForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUpdateModuleMutation } from "@/store/module/module.api";
import type { Module } from "@/store/module/module.type";

export function EditModuleDialog({ module }: { module: Module }) {
  const [open, setOpen] = useState(false);
  const [updateModule] = useUpdateModuleMutation();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={(event) => event.stopPropagation()} className="w-[90px] cursor-pointer 2xl:w-[100px]" variant="outline">
          Редагувати
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редагувати модуль</DialogTitle>
        </DialogHeader>

        <ModuleForm
          initial={module}
          submitText="Зберегти"
          onCancel={() => setOpen(false)}
          onSubmit={async (payload) => {
            await updateModule({ id: module.id, data: payload }).unwrap();
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
