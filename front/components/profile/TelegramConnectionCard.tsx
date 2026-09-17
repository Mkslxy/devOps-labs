"use client";

import { useState } from "react";
import { CheckCircle2, Copy, ExternalLink, LinkIcon, RefreshCw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetTelegramStartLinkQuery } from "@/store/telegram/telegram.api";

export function TelegramConnectionCard() {
  const [copied, setCopied] = useState(false);
  const { data, isLoading, isError, refetch } = useGetTelegramStartLinkQuery();

  const handleCopy = async () => {
    if (!data?.link) return;

    await navigator.clipboard.writeText(data.link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="overflow-hidden rounded-md">
      <CardHeader className="border-b p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Send className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">Telegram-сповіщення</CardTitle>
              <CardDescription className="mt-1">
                Нагадування про уроки та важливі повідомлення школи.
              </CardDescription>
            </div>
          </div>

          <Badge variant={data?.link ? "secondary" : "outline"} className="w-fit">
            {data?.link ? "Готово до підключення" : "Очікує посилання"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4">
        <div className="rounded-md border bg-muted/20 p-3">
          <div className="flex items-center gap-3">
            <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Посилання для підключення</p>
              <p className="mt-1 truncate text-sm font-medium" title={data?.link || undefined}>
                {isLoading
                    ? "Завантаження..."
                    : isError
                        ? "Не вдалося завантажити посилання"
                        : data?.link || "Посилання недоступне"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            className="gap-2"
            disabled={!data?.link || isLoading}
            onClick={handleCopy}
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Скопійовано" : "Скопіювати посилання"}
          </Button>

          <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={!data?.link || isLoading}
              asChild={Boolean(data?.link)}
          >
            {data?.link ? (
                <a href={data.link} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Відкрити Telegram
                </a>
            ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Відкрити Telegram
                </>
            )}
          </Button>

          {isError ? (
            <Button
              type="button"
              variant="outline"
              className="gap-2 sm:col-span-2"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
              Спробувати знову
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
