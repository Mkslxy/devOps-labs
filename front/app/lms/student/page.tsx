"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Calendar, Clock, Trophy, TrendingUp, Loader2 } from "lucide-react"
import Link from "next/link"
import { useGetStudentDashboardQuery } from "@/store/stats/stats.api"

export default function StudentDashboardPage() {
  const { data, isLoading, isError } = useGetStudentDashboardQuery()

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
        <h1 className="text-3xl font-bold mb-2">Вітаємо в особистому кабінеті!</h1>
        <p className="text-muted-foreground">Ось ваша статистика навчання</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Активні курси</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.active_courses}</div>
            <p className="text-xs text-muted-foreground">Курси в процесі</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Уроків залишилось</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.lessons_left}</div>
            <p className="text-xs text-muted-foreground">З {data.lessons_total_paid} оплачених</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Відвідуваність</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.attendance_percent}%</div>
            <p className="text-xs text-muted-foreground">За весь час</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Досягнення</CardTitle>
            <Trophy className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.achievements_count}</div>
            <p className="text-xs text-muted-foreground">Пройдених тестів</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Найближчі уроки</CardTitle>
            <CardDescription>Ваш розклад на цей тиждень</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.upcoming_lessons.length === 0 && (
              <p className="text-sm text-muted-foreground">Немає запланованих уроків на найближчий час</p>
            )}
            {data.upcoming_lessons.map((lesson, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{lesson.course}</p>
                  <p className="text-sm text-muted-foreground">{lesson.teacher}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {lesson.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lesson.duration}
                    </span>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href="/lms/student/progress">Деталі</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Прогрес навчання</CardTitle>
            <CardDescription>Ваші досягнення по курсах</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.learning_progress.length === 0 && (
              <p className="text-sm text-muted-foreground">У вас ще немає активних курсів</p>
            )}
            {data.learning_progress.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.course}</span>
                  <span className="text-muted-foreground">{item.lessons_completed}/{item.lessons_total}</span>
                </div>
                <Progress value={item.progress} />
                <p className="text-xs text-muted-foreground">{item.progress}% завершено</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Домашні завдання</CardTitle>
          <CardDescription>Активні завдання, які потрібно здати</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.homework_tasks.length === 0 && (
              <p className="text-sm text-muted-foreground">Усі домашні завдання здані!</p>
            )}
            {data.homework_tasks.map((homework, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold">{homework.title}</p>
                  <p className="text-sm text-muted-foreground">{homework.course}</p>
                  <p
                    className={`text-xs mt-1 ${homework.status === "urgent" ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {homework.deadline}
                  </p>
                </div>
                <Button variant="outline" className="bg-transparent" asChild>
                  <Link href="/lms/student/homework">Відкрити</Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
