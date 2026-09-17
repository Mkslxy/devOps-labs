"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { CalendarClock, ClipboardCheck, Folder } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveList } from "@/components/ui/ResponsiveList";

import {
  useGetHomeWorkQuery,
  useGetHomeWorkSubmissionQuery,
} from "@/store/homework/homework.api";

import type { Homework } from "@/store/homework/homework.type";

import {LESSON_CATEGORY_LABELS} from "@/store/lessons/lesson.label";
import {LessonCategoryEnum} from "@/store/lessons/lesson.type";
import {DeleteHomeworkDialog} from "@/components/lms/homework/dialog/delete-homework/page";

const fmtDateTime = (v?: string | null) => {
  if (!v) return "Немає";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "Немає";
  return format(d, "dd.MM.yyyy HH:mm", { locale: uk });
};


export default function TeacherHomeworkPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useGetHomeWorkQuery({
    page,
    page_size: pageSize,
    ordering: "-created_at",
  });

  const { data: submissionsMeta } = useGetHomeWorkSubmissionQuery({
    page: 1,
    page_size: 1,
    ordering: "-created_at",
  });

  const totalHomeworks = data?.count ?? 0;
  const totalSubmissions = submissionsMeta?.count ?? 0;

  const soonCount = useMemo(() => {
    const list = data?.results ?? [];
    const now = Date.now();
    const in48h = now + 48 * 60 * 60 * 1000;

    return list.reduce((acc, hw) => {
      const t = new Date(hw.deadline).getTime();
      if (!Number.isNaN(t) && t >= now && t <= in48h) return acc + 1;
      return acc;
    }, 0);
  }, [data]);

  const statStorage = useMemo(() => {
    const list = data?.results ?? [];
    const files = list.reduce((acc, hw) => acc + (hw.files?.length ?? 0), 0);
    const links = list.reduce((acc, hw) => acc + (hw.links?.length ?? 0), 0);
    return { files, links };
  }, [data]);

  return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Домашні завдання</h1>
            <p className="text-muted-foreground">Керуйте домашніми завданнями та перевіряйте здачі</p>
          </div>

          <Button onClick={() => router.push("/lms/teacher/homework/add")}>
            + Додати ДЗ
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Folder className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalHomeworks}</p>
                  <p className="text-sm text-muted-foreground">Всього ДЗ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <CalendarClock className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{soonCount}</p>
                  <p className="text-sm text-muted-foreground">Дедлайн за 48 год</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSubmissions}</p>
                  <p className="text-sm text-muted-foreground">Всього здач</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Останні ДЗ</CardTitle>
            <CardDescription>
              {`Файлів: ${statStorage.files}, посилань: ${statStorage.links}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ResponsiveList
                data={data}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                isLoading={isLoading}
                getId={(hw: Homework) => hw.id}
                header={
                  <Card className="px-4 py-3 grid grid-cols-2 xl:grid-cols-7 text-sm font-medium text-muted-foreground">
                    <div>Завдання</div>
                    <div className="hidden xl:block">Група</div>
                    <div className="hidden xl:block">Студент</div>
                    <div className="hidden xl:block">Урок</div>
                    <div className="hidden xl:block">Дедлайн</div>
                    <div className="hidden xl:block">Матеріали</div>
                    <div className="text-right xl:text-center">Дії</div>
                  </Card>
                }
                renderRow={(hw: Homework, _open, onToggle) => {
                  const groupName = hw.group?.name || "Не обрано";
                  const studentName = hw.student?.full_name || hw.student?.email || "Не обрано";
                  const lessonTopic = hw.lesson?.topic || "Не обрано";

                  const filesCount = hw.files?.length ?? 0;
                  const linksCount = hw.links?.length ?? 0;

                  return (
                      <Card
                          onClick={onToggle}
                          className="px-4 py-3 grid grid-cols-2 xl:grid-cols-7 items-center cursor-pointer md:cursor-default"
                      >
                        <div className="font-medium w-[100px] break-all">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{hw.title || "Немає"}</span>
                          </div>
                        </div>

                        <div className="hidden xl:block break-all">{groupName}</div>
                        <div className="hidden xl:block break-all">{studentName}</div>
                        <div className="hidden xl:block break-all">{lessonTopic}</div>
                        <div className="hidden xl:block text-sm">{fmtDateTime(hw.deadline)}</div>

                        <div className="hidden xl:block text-sm">
                          {filesCount || linksCount ? `${filesCount} файл(ів), ${linksCount} лінк(ів)` : "Немає"}
                        </div>

                        <div className="flex xl:flex-col [@media(min-width:1800px)]:flex-row flex-col md:flex-row justify-end xl:justify-center gap-2">
                          <Button
                              className="cursor-pointer"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/lms/teacher/homework/submission/${hw.id}/`);
                              }}
                          >
                            Здачі
                          </Button>

                          <Button
                              className="cursor-pointer"
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/lms/teacher/homework/edit/${hw.id}`);
                              }}
                          >
                            Редагувати
                          </Button>

                          <DeleteHomeworkDialog
                              homeworkId={hw.id}
                              homeworkTitle={hw.title}
                          />
                        </div>
                      </Card>
                  );
                }}
                renderMobileDetails={(hw: Homework) => {
                  const groupName = hw.group?.name || "Немає";
                  const studentName = hw.student?.full_name || hw.student?.email || "Немає";
                  const lessonTopic = hw.lesson?.topic || "Немає";

                  const filesCount = hw.files?.length ?? 0;
                  const linksCount = hw.links?.length ?? 0;

                  const categoryLabel =
                      hw.lesson?.category
                          ? LESSON_CATEGORY_LABELS[hw.lesson.category as LessonCategoryEnum]
                          : "Немає";

                  return (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="text-muted-foreground">Група</div>
                        <div className="text-right break-all">{groupName}</div>

                        <div className="text-muted-foreground">Студент</div>
                        <div className="text-right break-all">{studentName}</div>

                        <div className="text-muted-foreground">Урок</div>
                        <div className="text-right break-all">{lessonTopic}</div>

                        <div className="text-muted-foreground">Категорія</div>
                        <div className="text-right break-all">{categoryLabel}</div>

                        <div className="text-muted-foreground">Дедлайн</div>
                        <div className="text-right break-all">{fmtDateTime(hw.deadline)}</div>

                        <div className="text-muted-foreground">Матеріали</div>
                        <div className="text-right break-all">
                          {filesCount || linksCount ? `${filesCount} файл(ів), ${linksCount} лінк(ів)` : "Немає"}
                        </div>
                      </div>
                  );
                }}
            />
          </CardContent>
        </Card>
      </div>
  );
}
