import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import { useToast } from "@/hooks/use-toast";
import { formatApiError, validateRequiredFields, type FieldErrors } from "@/libs/form-validation";
import { useCreateSchoolMutation, useUpdateSchoolMutation } from "@/store/school/school.api";
import type { School, SchoolPayload } from "@/store/school/school.type";

function normalizeOptionalNumberString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

type SchoolFormErrors = FieldErrors<"name" | "city" | "address" | "api">;

export function SchoolUpsertDialog({
  school,
  trigger,
  onSuccess,
}: {
  school?: School | null;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}) {
  const isEdit = Boolean(school?.id);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [createSchool, { isLoading: isCreating }] = useCreateSchoolMutation();
  const [updateSchool, { isLoading: isUpdating }] = useUpdateSchoolMutation();
  const loading = isCreating || isUpdating;

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [errors, setErrors] = useState<SchoolFormErrors>({});

  useEffect(() => {
    if (!open) return;

    setName(school?.name ?? "");
    setCity(school?.city ?? "");
    setAddress(school?.address ?? "");
    setLatitude(school?.latitude ? String(school.latitude) : "");
    setLongitude(school?.longitude ? String(school.longitude) : "");
    setErrors({});
  }, [open, school]);

  const validate = () => {
    const nextErrors: SchoolFormErrors = validateRequiredFields([
      { key: "name", label: "Назва", value: name },
      { key: "city", label: "Місто", value: city },
      { key: "address", label: "Адреса", value: address },
    ]);

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const clearError = (key: keyof SchoolFormErrors) => {
    setErrors((previous) => ({ ...previous, [key]: undefined, api: undefined }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: SchoolPayload = {
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      latitude: normalizeOptionalNumberString(latitude),
      longitude: normalizeOptionalNumberString(longitude),
    };

    try {
      if (isEdit && school) {
        await updateSchool({ id: school.id, data: payload }).unwrap();
        toast({ title: "Школу оновлено" });
      } else {
        await createSchool(payload).unwrap();
        toast({ title: "Школу створено" });
      }

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        api: formatApiError(error, "Не вдалося зберегти школу."),
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редагувати школу" : "Додати школу"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {errors.api ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {errors.api}
            </div>
          ) : null}

          <div className="space-y-2" data-field-root>
            <RequiredLabel required>Назва</RequiredLabel>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                clearError("name");
              }}
              placeholder="Напр. Kodra School"
              aria-invalid={!!errors.name}
            />
            {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
          </div>

          <div className="space-y-2" data-field-root>
            <RequiredLabel required>Місто</RequiredLabel>
            <Input
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                clearError("city");
              }}
              placeholder="Напр. Ужгород"
              aria-invalid={!!errors.city}
            />
            {errors.city ? <p className="text-sm text-destructive">{errors.city}</p> : null}
          </div>

          <div className="space-y-2" data-field-root>
            <RequiredLabel required>Адреса</RequiredLabel>
            <Input
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                clearError("address");
              }}
              placeholder="Вулиця, будинок"
              aria-invalid={!!errors.address}
            />
            {errors.address ? <p className="text-sm text-destructive">{errors.address}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <RequiredLabel>Широта</RequiredLabel>
              <Input value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="Немає" />
            </div>

            <div className="space-y-2">
              <RequiredLabel>Довгота</RequiredLabel>
              <Input value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="Немає" />
            </div>
          </div>

          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Скасувати
            </Button>

            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? "Збереження..." : "Зберегти"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
