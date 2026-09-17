import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, GraduationCap, Users, BookOpen } from "lucide-react";

type Props = {
    scopeKind: "group" | "student" | "lesson";
    onOpen: (kind: Props["scopeKind"]) => void;
    groupName?: string;
    studentName?: string;
    lessonName?: string;
};

function ScopeCard({
                       title,
                       description,
                       icon,
                       badge,
                       onOpen,
                   }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    badge: string;
    onOpen: () => void;
}) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                        <CardTitle className="truncate">{title}</CardTitle>
                        <Badge variant="secondary" className="whitespace-nowrap">
                            {badge}
                        </Badge>
                    </div>

                    <CardDescription className="text-sm text-muted-foreground">
                        {description}
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="pt-2">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-muted-foreground">{icon}</div>
                    <Button variant="outline" className="bg-transparent cursor-pointer" onClick={onOpen}>
                        Відкрити
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function HomeworkScopeCards(props: Props) {
    const { onOpen, groupName, studentName, lessonName } = props;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScopeCard
                title="Група"
                description={groupName ? `Група: ${groupName}` : "Оберіть групу для фільтрації"}
                icon={<Users className="w-6 h-6" />}
                badge="Група"
                onOpen={() => onOpen("group")}
            />

            <ScopeCard
                title="Персонально"
                description={studentName ? `Профіль: ${studentName}` : "Немає"}
                icon={<GraduationCap className="w-6 h-6" />}
                badge="Профіль"
                onOpen={() => onOpen("student")}
            />

            <ScopeCard
                title="Урок"
                description={lessonName ? `Урок: ${lessonName}` : "Оберіть урок, де ви є"}
                icon={<BookOpen className="w-6 h-6" />}
                badge="Урок"
                onOpen={() => onOpen("lesson")}
            />
        </div>
    );
}