"use client";

import * as React from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useStudentStats } from "@/store/stats/stats.hooks";
import { StudentStatsDashboard } from "@/components/lms/student-stats/StudentStatsDashboard";
import { useStudentGroups } from "@/store/groups/group.hooks";

type TabMode = "personal" | "groups";

export default function StudentStatsPageClient() {
    const sp = useSearchParams();
    const router = useRouter();

    const tabRaw = sp.get("tab");
    const tab: TabMode = tabRaw === "groups" ? "groups" : "personal";

    const groupIdRaw = sp.get("group_id");
    const parsedGroupId = groupIdRaw ? Number(groupIdRaw) : null;
    const groupId =
        parsedGroupId && Number.isFinite(parsedGroupId) ? parsedGroupId : null;

    const {
        groups = [],
        isLoading: groupsLoading,
        error: groupsError,
    } = useStudentGroups();

    const statsQuery =
        tab === "groups" && groupId
            ? ({ mode: "me-group", group_id: groupId } as const)
            : ({ mode: "me" } as const);

    const { data, isLoading, isFetching, error } = useStudentStats(statsQuery);

    const setTab = (next: TabMode) => {
        const params = new URLSearchParams(sp.toString());

        params.set("tab", next);

        if (next === "personal") {
            params.delete("group_id");
        }

        router.replace(`?${params.toString()}`);
    };

    const setGroupId = (nextGroupId: number) => {
        const params = new URLSearchParams(sp.toString());

        params.set("tab", "groups");
        params.set("group_id", String(nextGroupId));

        router.replace(`?${params.toString()}`);
    };

    useEffect(() => {
        if (tab !== "groups") return;
        if (groupId) return;
        if (groupsLoading) return;
        if (groups.length === 0) return;

        setGroupId(groups[0].id);
    }, [tab, groupId, groupsLoading, groups.length]);

    return (
        <div className="space-y-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabMode)}>
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="personal">Персонально</TabsTrigger>
                    <TabsTrigger value="groups">По групах</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-4 space-y-4">
                    {isFetching ? (
                        <div className="text-sm text-muted-foreground">Оновлення...</div>
                    ) : null}

                    {isLoading ? (
                        <div>Завантаження...</div>
                    ) : error ? (
                        <div>Помилка завантаження</div>
                    ) : !data ? (
                        <div>Немає</div>
                    ) : (
                        <StudentStatsDashboard data={data} />
                    )}
                </TabsContent>

                <TabsContent value="groups" className="mt-4 space-y-4">
                    {groupsError ? <div>Помилка завантаження груп</div> : null}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="text-sm text-muted-foreground">Група</div>

                        <Select
                            value={groupId ? String(groupId) : ""}
                            onValueChange={(v) => setGroupId(Number(v))}
                            disabled={groupsLoading || groups.length === 0}
                        >
                            <SelectTrigger className="w-full sm:w-[360px]">
                                <SelectValue
                                    placeholder={
                                        groupsLoading ? "Завантаження..." : "Оберіть групу"
                                    }
                                />
                            </SelectTrigger>

                            <SelectContent>
                                {groups.map((g) => (
                                    <SelectItem key={g.id} value={String(g.id)}>
                                        {g.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isFetching ? (
                        <div className="text-sm text-muted-foreground">Оновлення...</div>
                    ) : null}

                    {isLoading ? (
                        <div>Завантаження...</div>
                    ) : error ? (
                        <div>Помилка завантаження</div>
                    ) : !data ? (
                        <div>Немає</div>
                    ) : (
                        <StudentStatsDashboard data={data} />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
