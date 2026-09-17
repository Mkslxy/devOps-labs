"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  defaultLanguage,
  isLanguage,
  translateText,
  type Language,
} from "@/libs/i18n";

const storageKey = "unischool-language";
const cookieKey = "unischool-language";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (value: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function persistLanguage(language: Language) {
  window.localStorage.setItem(storageKey, language);
  document.cookie = `${cookieKey}=${language}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.lang = language;
}

export function I18nProvider({
  children,
  initialLanguage = defaultLanguage,
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return initialLanguage;

    const stored = window.localStorage.getItem(storageKey);
    return isLanguage(stored) ? stored : initialLanguage;
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (isLanguage(stored)) {
      setLanguageState(stored);
      persistLanguage(stored);
      return;
    }

    persistLanguage(initialLanguage);
  }, [initialLanguage]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    persistLanguage(nextLanguage);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (text) => translateText(text, language),
    }),
    [language, setLanguage]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
