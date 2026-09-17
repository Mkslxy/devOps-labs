import React from "react";
import { Upload, Sparkles, Clock, CheckCircle2, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatPill } from "./stat-pill";
import { ProgressBar } from "./progress-bar";

type Props = {
    title: string;
    subtitle?: string;

    isLoading: boolean;

    needAction: number;
    inReview: number;
    completed: number;
    total: number;

    onOpenNearest: () => void;

    groupSelectSlot?: React.ReactNode;
    helperSlot?: React.ReactNode;
};

export function DashboardHeaderCard({
                                        title,
                                        subtitle,
                                        isLoading,
                                        needAction,
                                        inReview,
                                        completed,
                                        total,
                                        onOpenNearest,
                                        groupSelectSlot,
                                        helperSlot,
                                    }: Props) {
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return (
        <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <CardTitle className="text-xl sm:text-3xl">{title}</CardTitle>
                            {subtitle ? (
                                <div className="text-sm text-muted-foreground">{subtitle}</div>
                            ) : null}
                        </div>

                        <div className="max-w-md space-y-2">
                            {groupSelectSlot}
                            {helperSlot}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <Button onClick={onOpenNearest} className="cursor-pointer" disabled={isLoading}>
                            <Upload className="w-4 h-4 mr-2" />
                            Перейти до найближчого
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <StatPill label="Потрібна дія" value={`${needAction}`} icon={<Clock className="w-4 h-4" />} />
                    <StatPill label="На перевірці" value={`${inReview}`} icon={<CheckCircle2 className="w-4 h-4" />} />
                    <StatPill label="Оцінено" value={`${completed}`} icon={<GraduationCap className="w-4 h-4" />} />
                    <StatPill label="Прогрес" value={`${progress}%`} icon={<Sparkles className="w-4 h-4" />} />
                </div>

                <ProgressBar completed={completed} total={total} />

                {isLoading ? <div className="text-sm text-muted-foreground">Завантаження...</div> : null}
            </CardContent>
        </Card>
    );
}