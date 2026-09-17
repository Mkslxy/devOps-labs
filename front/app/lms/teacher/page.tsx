"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Calendar, Clock, DollarSign, Video, Loader2 } from "lucide-react"
import Link from "next/link"
import { useGetTeacherDashboardQuery } from "@/store/stats/stats.api"
import { useGetTeacherSalaryStatsQuery } from "@/store/salary/teacher-salary.api"

export default function TeacherDashboardPage() {
  const { data, isLoading, isError } = useGetTeacherDashboardQuery()
  const { data: salaryStats, isLoading: loadingSalaryStats } = useGetTeacherSalaryStatsQuery()

  const moneyFormatter = useMemo(() => {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "UAH",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }, []);

  const clearSalaryValue =
    salaryStats?.clear_salary === null ||
    salaryStats?.clear_salary === undefined ||
    Number.isNaN(Number(salaryStats?.clear_salary))
      ? 0
      : Number(salaryStats?.clear_salary);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Не вдалося завантажити дані дашборду</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Панель викладача</h1>
        <p className="text-muted-foreground">Керуйте вашими заняттями та студентами</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Активні студенти</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.active_students}</div>
            <p className="text-xs text-muted-foreground">{data.active_groups} груп</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Уроків цього тижня</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.lessons_this_week}</div>
            <p className="text-xs text-muted-foreground">З {data.planned_lessons_this_week} запланованих</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Відпрацьовано годин</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.hours_worked_this_month}</div>
            <p className="text-xs text-muted-foreground">За цей місяць</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Зарплата</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSalaryStats ? (
              <div className="h-8 w-24 animate-pulse bg-muted rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold">{moneyFormatter.format(clearSalaryValue)}</div>
                <p className="text-xs text-muted-foreground">До виплати</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Найближчі уроки</CardTitle>
            <CardDescription>Ваш розклад на сьогодні</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.upcoming_lessons.length === 0 && (
              <p className="text-sm text-muted-foreground">Немає запланованих уроків на найближчий час</p>
            )}
            {data.upcoming_lessons.map((lesson, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Video className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold truncate">{lesson.student}</p>
                    <span className="text-xs text-muted-foreground">{lesson.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{lesson.type}</span>
                    <span>•</span>
                    <span>{lesson.students} студентів</span>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href="/lms/teacher/calendar">Розклад</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Завдання на перевірку</CardTitle>
            <CardDescription>Домашні завдання від студентів</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.tasks_for_review.length === 0 && (
              <p className="text-sm text-muted-foreground">Усі завдання перевірено!</p>
            )}
            {data.tasks_for_review.map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <Avatar>
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {item.student
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.student}</p>
                  <p className="text-sm text-muted-foreground">{item.assignment}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.submitted}</p>
                </div>
                <Button size="sm" variant="outline" className="bg-transparent" asChild>
                  <Link href="/lms/teacher/homework">Перевірити</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Мої студенти</CardTitle>
              <CardDescription>Студенти у ваших активних групах</CardDescription>
            </div>
            <Button variant="outline" className="bg-transparent" asChild>
              <Link href="/lms/teacher/students">Переглянути всіх</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recent_students.length === 0 && (
              <p className="text-sm text-muted-foreground">У вас ще немає активних студентів</p>
            )}
            {data.recent_students.map((student, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.course}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">{student.progress}%</p>
                    <p className="text-xs text-muted-foreground">Прогрес</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{student.attendance}</p>
                    <p className="text-xs text-muted-foreground">Відвідуваність</p>
                  </div>
                  <Button size="sm" variant="outline" className="bg-transparent" asChild>
                    <Link href="/lms/teacher/students">Детальніше</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
