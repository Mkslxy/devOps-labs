"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveList } from "@/components/ui/ResponsiveList";
import { AppErrorState } from "@/components/ui/app-state";
import { LmsPage } from "@/components/layout/lms-page";
import {
  useGetTestAssignmentsQuery,
  useStartAttemptMutation,
} from "@/store/test-management/test-management.api";

export default function StudentTestsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useGetTestAssignmentsQuery({
    page,
    page_size: 50,
  });
  const [startAttempt, { isLoading: isStarting }] = useStartAttemptMutation();

  const onStart = async (assignmentId: number) => {
    try {
      const res: any = await startAttempt({ assignment_id: assignmentId }).unwrap();
      router.push(`/lms/student/tests/attempt/${res.attempt_id}`);
    } catch (err: any) {
      const attemptId = err?.data?.attempt_id;
      if (attemptId) {
        router.push(`/lms/student/tests/attempt/${attemptId}`);
        return;
      }
      throw err;
    }
  };

  return (
    <LmsPage
      title="Мої тести"
      description="Призначені тести, дедлайни, прохідний бал та результати."
    >
      {isError ? (
        <AppErrorState onAction={refetch} />
      ) : (
        <ResponsiveList
          data={data}
          page={page}
          pageSize={50}
          onPageChange={setPage}
          isLoading={isLoading}
          getId={(assignment: any) => assignment.id}
          emptyTitle="Немає призначених тестів"
          emptyDescription="Коли викладач призначить тест, він з'явиться у цьому списку."
          header={
            <Card className="grid grid-cols-2 px-4 py-3 text-sm font-medium text-muted-foreground shadow-sm xl:grid-cols-7">
              <div>Тест</div>
              <div className="hidden xl:block">Тип</div>
              <div className="hidden xl:block">Прохідний</div>
              <div className="hidden xl:block">Доступний з</div>
              <div className="hidden xl:block">Дедлайн</div>
              <div className="hidden xl:block">Ліміт часу</div>
              <div className="text-right xl:text-center">Дії</div>
            </Card>
          }
          renderRow={(assignment: any, _open, onToggle) => {
            const version = assignment.pinned_version;
            const timeLimit = assignment.custom_time_limit ?? version?.time_limit_minutes ?? null;
            const passingScore = assignment.custom_passing_score ?? version?.passing_score_percent ?? null;
            const typeLabel = assignment.lesson ? "Урок" : assignment.material ? "Матеріал" : "Немає";

            return (
              <Card
                onClick={onToggle}
                className="grid cursor-pointer grid-cols-2 items-center gap-3 px-4 py-3 shadow-sm md:cursor-default xl:grid-cols-7"
              >
                <div className="min-w-0 font-medium">
                  <span className="block truncate">{assignment.test.title}</span>
                </div>
                <div className="hidden xl:block">{typeLabel}</div>
                <div className="hidden xl:block">{passingScore !== null ? `${passingScore}%` : "Немає"}</div>
                <div className="hidden text-sm xl:block">
                  {assignment.starting_at ? new Date(assignment.starting_at).toLocaleDateString("uk-UA") : "Немає"}
                </div>
                <div className="hidden text-sm xl:block">
                  {assignment.closing_at ? new Date(assignment.closing_at).toLocaleDateString("uk-UA") : "Без обмежень"}
                </div>
                <div className="hidden text-sm xl:block">{timeLimit ? `${timeLimit} хв` : "Немає"}</div>
                <div className="flex flex-col justify-end gap-2 xl:flex-row xl:justify-center">
                  <Button size="sm" onClick={() => onStart(assignment.id)} disabled={isStarting}>
                    Почати
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/lms/student/tests/review/${assignment.id}`);
                    }}
                  >
                    Результати
                  </Button>
                </div>
              </Card>
            );
          }}
          renderMobileDetails={(assignment: any) => {
            const version = assignment.pinned_version;
            const timeLimit = assignment.custom_time_limit ?? version?.time_limit_minutes ?? null;
            const passingScore = assignment.custom_passing_score ?? version?.passing_score_percent ?? null;

            return (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">Тип</div>
                <div className="text-right">{assignment.lesson ? "Урок" : assignment.material ? "Матеріал" : "Немає"}</div>
                <div className="text-muted-foreground">Доступний з</div>
                <div className="text-right">{assignment.starting_at ? new Date(assignment.starting_at).toLocaleString("uk-UA") : "Немає"}</div>
                <div className="text-muted-foreground">Дедлайн</div>
                <div className="text-right">{assignment.closing_at ? new Date(assignment.closing_at).toLocaleString("uk-UA") : "Без обмежень"}</div>
                <div className="text-muted-foreground">Ліміт часу</div>
                <div className="text-right">{timeLimit ? `${timeLimit} хв` : "Немає"}</div>
                <div className="text-muted-foreground">Прохідний бал</div>
                <div className="text-right">{passingScore !== null ? `${passingScore}%` : "Немає"}</div>
              </div>
            );
          }}
        />
      )}
    </LmsPage>
  );
}

