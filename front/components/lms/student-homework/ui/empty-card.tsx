"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyCard({
                              title,
                              description,
                              icon,
                          }: {
    title: string;
    description: string;
    icon: React.ReactNode;
}) {
    return (
        <Card className="border-dashed">
            <CardContent className="py-8">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-muted-foreground">{icon}</div>
                    <div>
                        <div className="font-semibold">{title}</div>
                        <div className="text-sm text-muted-foreground">{description}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
