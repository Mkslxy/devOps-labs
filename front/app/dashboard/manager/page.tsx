"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, UserPlus, Layers, Calendar, Loader2 } from "lucide-react"
import { useGetManagerDashboardQuery } from "@/store/stats/stats.api"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

function formatTimeAgo(dateString: string): string {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60_000)

    if (diffMinutes < 1) return "Щойно"
    if (diffMinutes < 60) return `${diffMinutes} хв тому`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} год тому`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} дн тому`
}

const statusLabel: Record<string, string> = {
    new: "Нова",
    processing: "В обробці",
    converted: "Конвертовано",
    rejected: "Відхилено",
}

const statusClass: Record<string, string> = {
    new: "bg-destructive/10 text-destructive",
    processing: "bg-primary/10 text-primary",
    converted: "bg-green-500/10 text-green-600",
    rejected: "bg-muted text-muted-foreground",
}

export default function AdminDashboardPage() {
    const { data, isLoading, isError } = useGetManagerDashboardQuery()

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
                <p className="text-muted-foreground">Не вдалося завантажити дані</p>
            </div>
        )
    }

    const statCards = [
        {
            title: "Всього студентів",
            value: data.total_students,
            icon: Users,
        },
        {
            title: "Активних викладачів",
            value: data.total_teachers,
            icon: GraduationCap,
        },
        {
            title: "Активних груп",
            value: data.total_groups,
            icon: Layers,
        },
        {
            title: "Нові заявки",
            value: data.new_leads,
            icon: UserPlus,
        },
        {
            title: "Уроків цього місяця",
            value: data.completed_lessons_this_month,
            icon: Calendar,
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Панель адміністратора</h1>
                <p className="text-muted-foreground">Загальна статистика школи</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Активність за 7 днів</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.chart_data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey="display_date" 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line 
                                        name="Нові заявки"
                                        type="monotone" 
                                        dataKey="leads" 
                                        stroke="hsl(var(--primary))" 
                                        strokeWidth={2}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line 
                                        name="Проведені уроки"
                                        type="monotone" 
                                        dataKey="lessons" 
                                        stroke="#10b981" 
                                        strokeWidth={2}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {data.recent_leads.length > 0 && (
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Останні заявки</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.recent_leads.map((lead) => (
                                <div key={lead.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-semibold">{lead.name}</p>
                                        {lead.phone && (
                                            <p className="text-sm text-muted-foreground">{lead.phone}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground">{lead.source}</span>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatTimeAgo(lead.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs px-2 py-1 rounded-full ${statusClass[lead.status] ?? "bg-muted text-muted-foreground"}`}>
                                            {statusLabel[lead.status] ?? lead.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

