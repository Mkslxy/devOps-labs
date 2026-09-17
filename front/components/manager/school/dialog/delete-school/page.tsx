"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useDeleteSchoolMutation } from "@/store/school/school.api";

interface Props {
  id: number;
  name?: string;
  trigger?: React.ReactNode;
}

export function DeleteSchoolDialog({ id, name, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [deleteSchool, { isLoading }] = useDeleteSchoolMutation();
  const { toast } = useToast();

  const confirm = async () => {
    try {
      await deleteSchool(id).unwrap();
      toast({ title: "Школу видалено" });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error?.data?.detail || "Не вдалося видалити школу",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            onClick={(event) => event.stopPropagation()}
            className="w-full cursor-pointer"
            variant="destructive"
          >
            Видалити
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Підтвердження</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Ви впевнені, що хочете видалити школу{" "}
          <span className="font-medium text-foreground">{name || "Немає"}</span>?
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Скасувати
          </Button>

          <Button variant="destructive" onClick={confirm} disabled={isLoading}>
            {isLoading ? "Видалення..." : "Видалити"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
