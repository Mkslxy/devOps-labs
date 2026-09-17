export type ValidationRule = {
  test: (value: string) => boolean;
  message: string;
};

export type FieldRules = {
  [key: string]: ValidationRule[];
};

// Універсальна функція валідації
export const validateField = (value: string, rules: ValidationRule[]) => {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.test(value)) {
      errors.push(rule.message);
    }
  }

  return errors;
};

export const emailRules: ValidationRule[] = [
  {
    test: (value) => value.length > 0,
    message: "Email обов'язковий",
  },
  {
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: "Введіть коректний email",
  },
];

export const passwordRules: ValidationRule[] = [
  {
    test: (value) => value.length >= 8,
    message: "Пароль має містити мінімум 8 символів",
  },
];

export const nameRules: ValidationRule[] = [
  {
    test: (value) => value.length >= 2,
    message: "Ім'я має містити мінімум 2 символи",
  },
  {
    test: (value) => /^[A-Za-zА-Яа-яЁёЇїІіЄєҐґ\s'-]+$/.test(value),
    message: "Ім'я може містити тільки літери та пробіли",
  },
  {
    test: (value) => {
      const words = value.trim().split(/\s+/);
      return words.length >= 2;
    },
    message: "Введіть ім'я та прізвище",
  },
];

export const phoneRules: ValidationRule[] = [
  {
    test: (value) => value.length >= 9,
    message: "Телефон має містити мінімум 9 цифр",
  },
];

export const dateOfBirthRules: ValidationRule[] = [
  {
    test: (value) => value.length > 0,
    message: "Дата народження обов'язкова",
  },
  {
    test: (value) => {
      const date = new Date(value);
      const now = new Date();
      const minDate = new Date(1900, 0, 1);
      return date >= minDate && date <= now;
    },
    message: "Введіть коректну дату народження",
  },
  {
    test: (value) => {
      const date = new Date(value);
      const now = new Date();
      const minAgeDate = new Date(
        now.getFullYear() - 5,
        now.getMonth(),
        now.getDate()
      );
      return date <= minAgeDate;
    },
    message: "Вік має бути не менше 5 років",
  },
];

// Функція для валідації всієї форми
export const validateForm = (
  formData: Record<string, string>,
  rules: FieldRules
) => {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  for (const field in rules) {
    if (rules[field]) {
      const fieldErrors = validateField(formData[field] || "", rules[field]);
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
};
