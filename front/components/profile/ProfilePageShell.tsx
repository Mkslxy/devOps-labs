"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProfileInfoCard } from "@/components/profile/ProfileInfoCard";
import { ProfileRolesTreeCard } from "@/components/profile/ProfileRolesTreeCard";
import { TelegramConnectionCard } from "@/components/profile/TelegramConnectionCard";

type ProfilePageShellProps = {
    title?: string;
    description?: string;
    showSchools?: boolean;
    showRoles?: boolean;
    side?: React.ReactNode;
    children?: React.ReactNode;
};

export function ProfilePageShell({
                                     title = "Профіль",
                                     description = "Особисті дані, підключення та робоча структура користувача.",
                                     showSchools = true,
                                     showRoles = true,
                                     side,
                                     children,
                                 }: ProfilePageShellProps) {
    return (
        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4">
            <Card className="rounded-md p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
                        </div>
                        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
                <div className="min-w-0 space-y-4">
                    <ProfileInfoCard showSchools={showSchools} />
                    <TelegramConnectionCard />
                    {children}
                </div>

                <div className="min-w-0 space-y-4">
                    {side}
                    {showRoles ? <ProfileRolesTreeCard /> : null}
                </div>
            </div>
        </div>
    );
}
