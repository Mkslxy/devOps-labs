"use client";

import { useEffect } from "react";

function getFieldName(target: HTMLElement) {
  const explicit = target.getAttribute("data-required-label");
  if (explicit) return explicit;

  const id = target.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent?.trim()) {
      return label.textContent.replace("*", "").trim();
    }
  }

  return "це поле";
}

function ensureError(target: HTMLElement, message?: string) {
  const field = target.closest("[data-field-root]") ?? target.parentElement;
  if (!field) return;

  target.setAttribute("aria-invalid", "true");

  let error = field.querySelector<HTMLElement>("[data-auto-field-error]");
  if (!error) {
    error = document.createElement("p");
    error.setAttribute("data-auto-field-error", "true");
    error.className = "mt-1 text-sm text-destructive";
    field.appendChild(error);
  }

  error.textContent = message || `Заповніть поле "${getFieldName(target)}".`;
}

function clearError(target: HTMLElement) {
  const field = target.closest("[data-field-root]") ?? target.parentElement;
  target.removeAttribute("aria-invalid");
  field?.querySelector("[data-auto-field-error]")?.remove();
}

function isCustomRequiredEmpty(target: HTMLElement) {
  if (!target.matches("[data-required-empty='true']")) return false;
  return target.getAttribute("aria-disabled") !== "true";
}

export function FormValidationProvider() {
  useEffect(() => {
    const onInvalid = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      ensureError(target);
    };

    const onInput = (event: Event) => {
      const target = event.target;
      if (
        !(
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement
        )
      ) {
        return;
      }

      if (target.checkValidity()) clearError(target);
    };

    const onCustomInteraction = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const field = target.closest<HTMLElement>("[data-required-empty]");
      if (!field) return;
      if (field.getAttribute("data-required-empty") !== "true") clearError(field);
    };

    const onSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const emptyCustom = Array.from(
        form.querySelectorAll<HTMLElement>("[data-required-empty='true']")
      ).filter(isCustomRequiredEmpty);

      if (emptyCustom.length) {
        event.preventDefault();
        event.stopPropagation();
        emptyCustom.forEach((field) => ensureError(field));
        emptyCustom[0]?.focus?.();
      }
    };

    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    document.addEventListener("click", onCustomInteraction, true);
    document.addEventListener("submit", onSubmit, true);

    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
      document.removeEventListener("click", onCustomInteraction, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  return null;
}
