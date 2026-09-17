"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

const links = [
  { href: "/", label: "Головна" },
  { href: "#courses", label: "Курси" },
  { href: "#about", label: "Про нас" },
  { href: "#contact", label: "Контакти" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
              US
            </div>
            <span className="hidden text-xl font-bold sm:inline">UniSchool</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Вхід</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">Реєстрація</Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Відкрити меню"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        {mobileMenuOpen ? (
          <div className="space-y-4 border-t py-4 md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="grid gap-2 pt-2">
              <LanguageSwitcher className="w-fit" />
              <Button variant="outline" asChild>
                <Link href="/auth/login">Вхід</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Реєстрація</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

