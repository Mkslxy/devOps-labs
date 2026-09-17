"use client";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export function DashboardHeader() {
  return (
    <header className="sticky top-14 z-30 border-b bg-card/95 backdrop-blur lg:top-0">
      <div className="flex min-h-[72px] items-center justify-end gap-4 px-4 py-4 md:px-6">
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact className="hidden sm:inline-flex" />
        </div>
      </div>
    </header>
  );
}
