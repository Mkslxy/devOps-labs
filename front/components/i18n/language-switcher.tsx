"use client";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { languageLabels, languageNames, languages } from "@/libs/i18n";
import { cn } from "@/libs/utils";
import { useI18n } from "@/components/providers/i18n-provider";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center gap-1 rounded-xl border bg-background/80 p-1 shadow-sm",
        className
      )}
      aria-label={t("Мова інтерфейсу")}
    >
      {!compact ? <Languages className="ml-2 size-4 text-muted-foreground" /> : null}
      {languages.map((item) => (
        <Button
          key={item}
          type="button"
          size="sm"
          variant={language === item ? "default" : "ghost"}
          className="h-8 min-w-9 rounded-lg px-2 text-xs font-semibold"
          onClick={() => setLanguage(item)}
          aria-label={languageNames[item]}
          aria-pressed={language === item}
        >
          {languageLabels[item]}
        </Button>
      ))}
    </div>
  );
}
