"use client";

import React, { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarCheck,
  ChevronDown,
  Clock,
  CreditCard,
  Loader2,
  Plus,
  RefreshCw,
  WalletCards,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LmsPage } from "@/components/layout/lms-page";
import { formatApiError } from "@/libs/form-validation";
import { cn } from "@/libs/utils";
import {
  useCreateInvoiceMutation,
  useCreateTopUpInvoiceMutation,
} from "@/store/finance/finance.api";
import { useGetSubscriptionPlansQuery } from "@/store/subscription/subscription-plan.api";
import type { SubscriptionPlan } from "@/store/subscription/subscription-plan.type";
import { STUDENT_SUBSCRIPTION_STATUS_LABELS } from "@/store/subscription/student-subscription.label";
import {
  StudentSubscriptionStatusEnum,
  type StudentSubscription,
} from "@/store/subscription/student-subscription.type";
import { useGetStudentSubscriptionsQuery } from "@/store/subscription/student-subscription.api";
import { useGetProfileMeQuery } from "@/store/users/user.api";

type PaymentAction =
  | { type: "purchase"; id: number }
  | { type: "top-up"; id: number }
  | null;

function formatMoney(value?: string | number | null, currency?: SubscriptionPlan["currency"]) {
  if (value === undefined || value === null || value === "") return "Немає";

  const amount = Number(value);
  const formattedAmount = Number.isFinite(amount)
    ? amount.toLocaleString("uk-UA", {
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      })
    : String(value);

  return `${formattedAmount} ${currency?.symbol || currency?.code || ""}`.trim();
}

function formatDate(value?: string | null) {
  if (!value) return "Немає";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getDaysUntilEnd(endDate?: string | null) {
  if (!endDate) return null;

  const dateParts = endDate.split("-");
  if (dateParts.length < 3) return null;

  const year = Number(dateParts[0]);
  const month = Number(dateParts[1]);
  const day = Number(dateParts[2]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedEndDate = new Date(year, month - 1, day);
  parsedEndDate.setHours(0, 0, 0, 0);

  return Math.ceil((parsedEndDate.getTime() - today.getTime()) / 86400000);
}

function formatDaysLeft(days: number | null) {
  if (days === null) return "Немає";
  if (days < 0) return "Абонемент завершився";
  if (days === 0) return "Останній день";

  const suffix = days === 1 ? "день" : days >= 2 && days <= 4 ? "дні" : "днів";
  return `${days} ${suffix}`;
}

function SubscriptionStatusBadge({ status }: { status?: StudentSubscriptionStatusEnum }) {
  if (!status) {
    return <Badge variant="secondary">Немає</Badge>;
  }

  return (
    <Badge
      variant={status === StudentSubscriptionStatusEnum.active ? "default" : "secondary"}
      className={cn(
        status === StudentSubscriptionStatusEnum.pending_assignment &&
          "border-amber-200 bg-amber-50 text-amber-700",
        status === StudentSubscriptionStatusEnum.completed &&
          "border-slate-200 bg-slate-100 text-slate-600",
      )}
    >
      {STUDENT_SUBSCRIPTION_STATUS_LABELS[status]}
    </Badge>
  );
}

function StatTile({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
}) {
  return (
    <div className="min-h-[104px] rounded-lg border bg-background p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="break-words text-base font-semibold text-foreground">{value}</div>
      {helper ? <div className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</div> : null}
    </div>
  );
}

function SubscriptionSummary({
  subscription,
  totalLessonsRemaining,
}: {
  subscription: StudentSubscription;
  totalLessonsRemaining: number;
}) {
  const daysUntilEnd = getDaysUntilEnd(subscription.end_date);
  const label =
    subscription.status === StudentSubscriptionStatusEnum.active
      ? "Поточний абонемент"
      : "Останній абонемент";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <WalletCards className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="mt-1 flex flex-wrap items-end gap-x-2 gap-y-1">
              <span className="text-4xl font-bold tracking-normal text-foreground">
                {totalLessonsRemaining}
              </span>
              <span className="pb-1 text-sm font-medium text-muted-foreground">
                занять залишилось
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {subscription.plan?.name || "Немає"}
            </p>
          </div>
        </div>
        <SubscriptionStatusBadge status={subscription.status} />
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          <StatTile
            icon={<BookOpenCheck className="size-4" />}
            label="План"
            value={subscription.plan?.name || "Немає"}
            helper={subscription.group?.name || "Групу ще не призначено"}
          />
          <StatTile
            icon={<CalendarCheck className="size-4" />}
            label="Дата початку"
            value={formatDate(subscription.start_date)}
          />
          <StatTile
            icon={<Clock className="size-4" />}
            label="До завершення"
            value={formatDaysLeft(daysUntilEnd)}
            helper={formatDate(subscription.end_date)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionHistory({
  subscriptions,
}: {
  subscriptions: StudentSubscription[];
}) {
  const [openedSubscriptionId, setOpenedSubscriptionId] = useState<number | null>(null);

  if (!subscriptions.length) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Інші абонементи</h2>
      </div>

      <div className="space-y-3">
        {subscriptions.map((subscription) => {
          const isOpened = openedSubscriptionId === subscription.id;
          const daysUntilEnd = getDaysUntilEnd(subscription.end_date);

          return (
            <Card key={subscription.id} className="py-0">
              <button
                type="button"
                onClick={() => setOpenedSubscriptionId(isOpened ? null : subscription.id)}
                className="flex min-h-[76px] w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {subscription.plan?.name || "Немає"}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {subscription.group?.name || "Групу ще не призначено"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      {subscription.lessons_remaining ?? "Немає"}
                    </p>
                    <p className="text-xs text-muted-foreground">занять</p>
                  </div>
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg border text-muted-foreground transition-transform",
                      isOpened && "rotate-180",
                    )}
                  >
                    <ChevronDown className="size-4" />
                  </div>
                </div>
              </button>

              <div
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  isOpened ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <div className="border-t px-5 py-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <StatTile
                        icon={<WalletCards className="size-4" />}
                        label="Статус"
                        value={<SubscriptionStatusBadge status={subscription.status} />}
                      />
                      <StatTile
                        icon={<BookOpenCheck className="size-4" />}
                        label="Залишилось занять"
                        value={subscription.lessons_remaining ?? "Немає"}
                      />
                      <StatTile
                        icon={<CalendarCheck className="size-4" />}
                        label="Дата початку"
                        value={formatDate(subscription.start_date)}
                      />
                      <StatTile
                        icon={<Clock className="size-4" />}
                        label="До завершення"
                        value={formatDaysLeft(daysUntilEnd)}
                        helper={formatDate(subscription.end_date)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function TopUpSection({
  subscription,
  lessonsCount,
  onLessonsCountChange,
  onPay,
  isLoading,
}: {
  subscription: StudentSubscription;
  lessonsCount: number;
  onLessonsCountChange: (value: number) => void;
  onPay: () => void;
  isLoading: boolean;
}) {
  const pricePerLesson = Number(subscription.plan?.price_per_lesson || 0);
  const canTopUp = Number.isFinite(pricePerLesson) && pricePerLesson > 0;
  const totalPrice = canTopUp ? pricePerLesson * lessonsCount : null;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <RefreshCw className="size-5" />
            Продовжити абонемент
          </CardTitle>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Додаткові заняття будуть зараховані до поточного активного абонемента.
          </p>
        </div>
        <Badge variant="outline">{formatMoney(subscription.plan?.price_per_lesson, subscription.plan?.currency)} / заняття</Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {!canTopUp ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Продовження недоступне</AlertTitle>
            <AlertDescription>
              Для цього плану не налаштована ціна одного заняття.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[minmax(180px,220px)_1fr_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="top-up-lessons">
              Кількість занять
            </label>
            <Input
              id="top-up-lessons"
              type="number"
              min={1}
              max={100}
              value={lessonsCount}
              disabled={isLoading}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                onLessonsCountChange(Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1);
              }}
            />
          </div>

          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">Сума до оплати</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {totalPrice === null
                ? "Немає"
                : formatMoney(totalPrice, subscription.plan?.currency)}
            </p>
          </div>

          <Button
            type="button"
            className="h-10 w-full md:w-auto"
            disabled={!canTopUp || isLoading}
            onClick={onPay}
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
            Оплатити продовження
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PlanPurchaseCard({
  plan,
  onPay,
  isLoading,
}: {
  plan: SubscriptionPlan;
  onPay: () => void;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="break-words text-lg">{plan.name}</CardTitle>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {plan.description || plan.course?.title || "Абонемент для занять у школі"}
            </p>
          </div>
          <Badge variant="outline">{plan.lessons_count} занять</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile
            icon={<CalendarCheck className="size-4" />}
            label="Термін"
            value={`${plan.duration_days} днів`}
          />
          <StatTile
            icon={<WalletCards className="size-4" />}
            label="Ціна"
            value={formatMoney(plan.price, plan.currency)}
          />
        </div>

        <Button type="button" className="w-full" disabled={isLoading} onClick={onPay}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
          Купити абонемент
        </Button>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 pt-0">
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    </div>
  );
}

export function StudentSubscriptionPageClient() {
  const [paymentErrorText, setPaymentErrorText] = useState("");
  const [topUpLessonsCount, setTopUpLessonsCount] = useState(1);
  const [paymentAction, setPaymentAction] = useState<PaymentAction>(null);

  const {
    data: profile,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
  } = useGetProfileMeQuery();

  const {
    data: subscriptionsData,
    isLoading: isSubscriptionsLoading,
    isFetching: isSubscriptionsFetching,
    isError: isSubscriptionsError,
  } = useGetStudentSubscriptionsQuery(
    profile?.id
      ? {
          student: profile.id,
          ordering: "-created_at",
        }
      : skipToken,
  );

  const {
    data: plansData,
    isLoading: isPlansLoading,
    isFetching: isPlansFetching,
    isError: isPlansError,
  } = useGetSubscriptionPlansQuery({
    is_active: true,
    ordering: "price",
  });

  const [createInvoice] = useCreateInvoiceMutation();
  const [createTopUpInvoice] = useCreateTopUpInvoiceMutation();

  const isLoading =
    isProfileLoading ||
    isProfileFetching ||
    isSubscriptionsLoading ||
    isSubscriptionsFetching ||
    isPlansLoading ||
    isPlansFetching;

  const subscriptions = subscriptionsData?.results || [];
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === StudentSubscriptionStatusEnum.active,
  );
  const pendingSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === StudentSubscriptionStatusEnum.pending_assignment,
  );
  const activeSubscription = activeSubscriptions[0];
  const mainSubscription = activeSubscription || pendingSubscriptions[0] || subscriptions[0];

  const otherSubscriptions = subscriptions.filter((subscription) => {
    return subscription.id !== mainSubscription?.id;
  });

  const totalLessonsRemaining = activeSubscriptions.length
    ? activeSubscriptions.reduce((total, subscription) => {
        return total + Number(subscription.lessons_remaining || 0);
      }, 0)
    : Number(mainSubscription?.lessons_remaining || 0);

  const availablePlans = useMemo(() => {
    const plans = plansData?.results || [];
    return plans.filter((plan) => plan.is_active);
  }, [plansData?.results]);

  const showPurchasePlans = !activeSubscription && !pendingSubscriptions.length;
  const currentActionKey = paymentAction ? `${paymentAction.type}:${paymentAction.id}` : "";

  const redirectToInvoice = (invoiceUrl?: string) => {
    if (!invoiceUrl) {
      setPaymentErrorText("Платіжне посилання не було отримано.");
      return;
    }

    window.location.href = invoiceUrl;
  };

  const handlePurchase = async (plan: SubscriptionPlan) => {
    try {
      setPaymentErrorText("");
      setPaymentAction({ type: "purchase", id: plan.id });

      const response = await createInvoice({ plan_id: plan.id }).unwrap();
      redirectToInvoice(response.invoiceUrl);
    } catch (error) {
      setPaymentErrorText(formatApiError(error, "Не вдалося створити оплату абонемента."));
    } finally {
      setPaymentAction(null);
    }
  };

  const handleTopUp = async () => {
    if (!activeSubscription) return;

    try {
      setPaymentErrorText("");
      setPaymentAction({ type: "top-up", id: activeSubscription.id });

      const response = await createTopUpInvoice({
        subscription_id: activeSubscription.id,
        lessons_count: topUpLessonsCount,
      }).unwrap();

      redirectToInvoice(response.invoiceUrl);
    } catch (error) {
      setPaymentErrorText(formatApiError(error, "Не вдалося створити оплату продовження."));
    } finally {
      setPaymentAction(null);
    }
  };

  return (
    <LmsPage
      title="Мій абонемент"
      description="Баланс занять, поточний статус і онлайн-оплата."
    >
      {isLoading ? (
        <LoadingState />
      ) : isSubscriptionsError || isPlansError ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Не вдалося завантажити абонементи</AlertTitle>
          <AlertDescription>
            Оновіть сторінку або зверніться до адміністратора.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {paymentErrorText ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Оплату не створено</AlertTitle>
              <AlertDescription>{paymentErrorText}</AlertDescription>
            </Alert>
          ) : null}

          {mainSubscription ? (
            <SubscriptionSummary
              subscription={mainSubscription}
              totalLessonsRemaining={totalLessonsRemaining}
            />
          ) : (
            <Card>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <WalletCards className="size-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Активного абонемента немає</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Оберіть один з доступних планів нижче.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSubscription ? (
            <TopUpSection
              subscription={activeSubscription}
              lessonsCount={topUpLessonsCount}
              onLessonsCountChange={setTopUpLessonsCount}
              onPay={handleTopUp}
              isLoading={currentActionKey === `top-up:${activeSubscription.id}`}
            />
          ) : pendingSubscriptions.length ? (
            <Alert>
              <Plus className="size-4" />
              <AlertTitle>Абонемент очікує призначення</AlertTitle>
              <AlertDescription>
                Після призначення групи адміністратором він стане активним.
              </AlertDescription>
            </Alert>
          ) : null}

          {showPurchasePlans ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Купити абонемент</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Після оплати абонемент зʼявиться у статусі очікування призначення.
                </p>
              </div>

              {availablePlans.length ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {availablePlans.map((plan) => (
                    <PlanPurchaseCard
                      key={plan.id}
                      plan={plan}
                      onPay={() => handlePurchase(plan)}
                      isLoading={currentActionKey === `purchase:${plan.id}`}
                    />
                  ))}
                </div>
              ) : (
                <Alert>
                  <WalletCards className="size-4" />
                  <AlertTitle>Доступних планів немає</AlertTitle>
                  <AlertDescription>
                    Наразі жоден абонемент не відкритий для онлайн-покупки.
                  </AlertDescription>
                </Alert>
              )}
            </section>
          ) : null}

          <SubscriptionHistory subscriptions={otherSubscriptions} />
        </div>
      )}
    </LmsPage>
  );
}
