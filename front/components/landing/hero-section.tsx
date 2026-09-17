"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-14 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="space-y-8">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Globe className="size-4 shrink-0" />
            <span className="truncate">Понад 10 000 студентів по всьому світу</span>
          </div>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-balance md:text-6xl lg:text-7xl">
              Вивчайте мови онлайн з професійними викладачами
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              Персоналізовані уроки, гнучкий розклад та перевірені методики для швидкого результату.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="gap-2 text-base" asChild>
              <Link href="#contact">
                Записатись на урок
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-background text-base" asChild>
              <Link href="#trial">Безкоштовний урок</Link>
            </Button>
          </div>

          <div className="grid max-w-lg grid-cols-2 gap-6 pt-2">
            <div>
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm leading-5 text-muted-foreground">
                Професійних викладачів
              </div>
            </div>
            <div className="border-l pl-6">
              <div className="text-3xl font-bold text-secondary">95%</div>
              <div className="text-sm leading-5 text-muted-foreground">
                Задоволених студентів
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute inset-0 rotate-6 rounded-[2rem] bg-gradient-to-br from-primary/20 to-secondary/20" />
          <div className="relative overflow-hidden rounded-[2rem] bg-card shadow-2xl">
            <Image
              src="/diverse-students-learning-languages-online.jpg"
              alt="Студенти навчаються онлайн"
              width={720}
              height={720}
              className="aspect-square h-auto w-full object-cover"
              priority
            />
          </div>

          <div className="absolute -bottom-5 left-3 rounded-2xl border bg-card p-4 shadow-lg sm:-left-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-xl">
                🎓
              </div>
              <div>
                <div className="font-semibold">Онлайн класи</div>
                <div className="text-sm text-muted-foreground">24/7 доступ</div>
              </div>
            </div>
          </div>

          <div className="absolute -right-2 -top-5 rounded-2xl bg-secondary p-4 text-secondary-foreground shadow-lg sm:-right-5">
            <div className="text-3xl font-bold">15+</div>
            <div className="text-sm">мов навчання</div>
          </div>
        </div>
      </div>
    </section>
  );
}

