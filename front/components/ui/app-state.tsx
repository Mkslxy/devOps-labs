import type { ReactNode } from "react";
import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/libs/utils";

type AppStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

function StateShell({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: AppStateProps) {
  return (
    <Card className={cn("bg-card shadow-[0_6px_18px_rgba(16,24,40,0.06)]", className)}>
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="max-w-md space-y-1.5">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actionLabel && onAction ? (
          <Button type="button" variant="outline" onClick={onAction}>
            <RefreshCw className="size-4" />
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AppLoadingState({
  title = "Завантаження...",
  description = "Отримуємо актуальні дані.",
  className,
}: Partial<AppStateProps>) {
  return (
    <StateShell
      title={title}
      description={description}
      className={className}
      icon={<Loader2 className="size-5 animate-spin" />}
    />
  );
}

export function AppErrorState({
  title = "Не вдалося завантажити дані",
  description = "Перевірте підключення або спробуйте ще раз.",
  actionLabel = "Повторити",
  onAction,
  className,
}: Partial<AppStateProps>) {
  return (
    <StateShell
      title={title}
      description={description}
      actionLabel={onAction ? actionLabel : undefined}
      onAction={onAction}
      className={className}
      icon={<AlertCircle className="size-5" />}
    />
  );
}

export function AppEmptyState({
  title = "Немає даних",
  description = "Тут з'явиться інформація, коли вона буде доступна.",
  actionLabel,
  onAction,
  className,
}: Partial<AppStateProps>) {
  return (
    <StateShell
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      className={className}
      icon={<Inbox className="size-5" />}
    />
  );
}
