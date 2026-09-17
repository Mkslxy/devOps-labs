import { Award, BookOpen, Calendar, MessageSquare, Users, Video } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Video,
    title: "Інтерактивні уроки",
    description: "Навчайтесь онлайн з професійними викладачами через відеозв'язок.",
  },
  {
    icon: Calendar,
    title: "Гнучкий розклад",
    description: "Обирайте зручний час для занять та легко переносіть уроки.",
  },
  {
    icon: BookOpen,
    title: "Власна платформа",
    description: "Курси, матеріали та домашні завдання доступні в особистому кабінеті.",
  },
  {
    icon: Users,
    title: "Групові та індивідуальні",
    description: "Оберіть формат навчання, який найкраще підходить саме вам.",
  },
  {
    icon: MessageSquare,
    title: "Підтримка",
    description: "Менеджери допоможуть із записом, оплатою та організаційними питаннями.",
  },
  {
    icon: Award,
    title: "Сертифікати",
    description: "Отримуйте підтвердження результату після завершення курсу.",
  },
];

export function FeaturesSection() {
  return (
    <section id="about" className="bg-muted/40 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-normal md:text-5xl">
            Чому обирають нас?
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Ми пропонуємо зрозумілу систему навчання, живу підтримку та прозорий прогрес.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} className="border bg-card shadow-sm transition-colors hover:border-primary/40">
                <CardContent className="space-y-4 p-6">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

