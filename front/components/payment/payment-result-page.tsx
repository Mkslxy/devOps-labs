import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/libs/utils";

type PaymentResultPageProps = {
  status: "success" | "fail";
};

const copy = {
  success: {
    icon: CheckCircle2,
    title: "Оплату прийнято",
    description:
      "Абонемент або продовження буде оновлено після підтвердження платежу платіжною системою.",
    tone: "bg-emerald-500/10 text-emerald-700",
    primaryHref: "/lms/student/subscription",
    primaryLabel: "До мого абонемента",
  },
  fail: {
    icon: XCircle,
    title: "Оплату не завершено",
    description: "Платіж було скасовано або відхилено. Спробуйте оплатити ще раз.",
    tone: "bg-destructive/10 text-destructive",
    primaryHref: "/lms/student/subscription",
    primaryLabel: "Повернутися до оплати",
  },
} satisfies Record<
  PaymentResultPageProps["status"],
  {
    icon: typeof CheckCircle2;
    title: string;
    description: string;
    tone: string;
    primaryHref: string;
    primaryLabel: string;
  }
>;

export function PaymentResultPage({ status }: PaymentResultPageProps) {
  const content = copy[status];
  const Icon = content.icon;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-5 text-center">
          <div className={cn("flex size-14 items-center justify-center rounded-lg", content.tone)}>
            <Icon className="size-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-normal text-foreground">
              {content.title}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">{content.description}</p>
          </div>

          <div className="grid w-full gap-2">
            <Button asChild>
              <Link href={content.primaryHref}>{content.primaryLabel}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">На головну</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
