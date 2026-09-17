"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, Loader2, RefreshCcw, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LmsPage, LmsPanel } from "@/components/layout/lms-page";
import { useGetProfileMeQuery } from "@/store/users/user.api";
import {
  StudentSubscription,
  StudentSubscriptionStatusEnum,
} from "@/store/subscription/student-subscription.type";
import { useGetStudentSubscriptionsQuery } from "@/store/subscription/student-subscription.api";

function getCourse(subscription: StudentSubscription) {
  return subscription.group?.course ?? subscription.plan?.course ?? null;
}

export default function StudentCoursesPage() {
  const {
    data: me,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useGetProfileMeQuery();

  const studentId = me?.id;
  const {
    data,
    isLoading: isSubscriptionsLoading,
    isError: isSubscriptionsError,
    refetch: refetchSubscriptions,
  } = useGetStudentSubscriptionsQuery(
    {
      student: studentId,
      status: StudentSubscriptionStatusEnum.active,
    },
    { skip: !studentId }
  );

  const subscriptions = data?.results ?? [];
  const isLoading = isProfileLoading || isSubscriptionsLoading;
  const isError = isProfileError || isSubscriptionsError;

  const retry = () => {
    if (studentId) {
      refetchSubscriptions();
      return;
    }

    refetchProfile();
  };

  return (
    <LmsPage
      title="Мої курси"
      description="Активні курси та підписки завантажуються з реальної бази даних."
      actions={
        <Button asChild>
          <Link href="/#courses">Переглянути всі курси</Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Завантаження курсів...
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p className="font-medium">Не вдалося завантажити курси.</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={retry}>
            <RefreshCcw className="size-4" />
            Спробувати знову
          </Button>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <BookOpen className="mx-auto mb-3 size-8" />
          <p className="font-medium">Поки немає активних курсів.</p>
        </div>
      ) : (
        <div className="grid gap-[18px] xl:grid-cols-2">
          {subscriptions.map((subscription) => {
            const course = getCourse(subscription);

            return (
              <LmsPanel
                key={subscription.id}
                title={course?.title ?? subscription.plan?.name ?? "Курс"}
                description={subscription.group?.name ?? subscription.plan?.description ?? "Активна підписка"}
                action={<Badge variant="secondary">{subscription.status ?? "active"}</Badge>}
              >
                <div className="space-y-6">
                  <div className="grid gap-[14px] sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <BookOpen className="size-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{subscription.lessons_remaining ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Уроків залишилось</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                        <CalendarDays className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{subscription.end_date ?? "Немає"}</p>
                        <p className="text-xs text-muted-foreground">Дата завершення</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-muted-foreground">План:</span>
                      <span className="font-medium">{subscription.plan?.name ?? "Немає"}</span>
                    </div>
                  </div>

                  <Button className="w-full" asChild>
                    <Link href="/lms/student/course-task">
                      <Video className="size-4" />
                      Продовжити навчання
                    </Link>
                  </Button>
                </div>
              </LmsPanel>
            );
          })}
        </div>
      )}
    </LmsPage>
  );
}
