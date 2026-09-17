export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

export function requiredMessage(label: string) {
  return `Заповніть поле "${label}".`;
}

export function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value !== 0;
  if (typeof value === "boolean") return value;
  return String(value ?? "").trim().length > 0;
}

export function validateRequiredFields<T extends string>(
  fields: Array<{ key: T; label: string; value: unknown }>
) {
  const errors: FieldErrors<T> = {};

  for (const field of fields) {
    if (!hasValue(field.value)) {
      errors[field.key] = requiredMessage(field.label);
    }
  }

  return errors;
}

export function formatApiError(error: unknown, fallback: string) {
  const apiError = error as {
    data?: Record<string, unknown> | string;
    error?: string;
    message?: string;
  };

  if (typeof apiError?.data === "string") return apiError.data;

  if (apiError?.data && typeof apiError.data === "object") {
    const data = apiError.data;
    const common = data.detail || data.message || data.non_field_errors || data.error;

    if (Array.isArray(common)) return common.join(" ");
    if (typeof common === "string") return common;

    const firstFieldError = Object.values(data).find(Boolean);
    if (Array.isArray(firstFieldError)) return firstFieldError.join(" ");
    if (typeof firstFieldError === "string") return firstFieldError;
  }

  return apiError?.message || apiError?.error || fallback;
}
