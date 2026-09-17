"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AssignmentForm } from "@/components/lms/test-management/assignments/forms/assignment-form";

import {
    useCreateTestAssignmentMutation,
    useGetTestsQuery,
    useGetTestVersionsQuery,
} from "@/store/test-management/test-management.api";

import { useGetAllLessonsQuery } from "@/store/lessons/lesson.api";
import { useGetMaterialsQuery } from "@/store/material/material.api";
import {StatusDaeEnum} from "@/store/test-management/test-management.type";
import {useGetGroupsQuery} from "@/store/groups/group.api";

export default function AddAssignmentPage() {
    const router = useRouter();

    const { data: testsData, isLoading: testsLoading } = useGetTestsQuery({ page: 1 });
    const { data: versionsData, isLoading: versionsLoading } = useGetTestVersionsQuery({ page: 1 });

    const { data: lessonsData, isLoading: lessonsLoading } = useGetAllLessonsQuery({
        page_size: 50,
        page: 1,
    });

    const { data: groupsData, isLoading: groupsLoading } = useGetGroupsQuery({
        page: 1,
        page_size: 50,
    });

    const { data: materialsData, isLoading: materialsLoading } = useGetMaterialsQuery({
        page: 1,
        page_size: 50,
        ordering: "-created_at",
    });

    const tests = useMemo(
        () => (testsData?.results ?? []).map((t) => ({ id: t.id, label: t.title })),
        [testsData]
    );

    const groups = useMemo(
        () =>
            (groupsData?.results ?? []).map((g) => ({
                id: g.id ?? 0,
                label: g.name ?? "Без назви",
            })),
        [groupsData]
    );

    const versions = useMemo(
        () =>
            (versionsData?.results ?? []).map((v) => ({
                id: v.id,
                testId: v.test,
                label: `Версія #${v.id}`,
                status: v.status as StatusDaeEnum,
            })),
        [versionsData]
    );

    const lessons = useMemo(
        () => (lessonsData?.results ?? []).map((l) => ({ id: l.id, label: l.topic })),
        [lessonsData]
    );

    const materials = useMemo(
        () =>
            (materialsData?.results ?? []).map((m) => ({
                id: m.id,
                label: m.title ?? `Матеріал #${m.id}`,
            })),
        [materialsData]
    );

    const [createAssignment, { isLoading: isSaving }] = useCreateTestAssignmentMutation();

    const isLoading = testsLoading || versionsLoading || lessonsLoading || materialsLoading || isSaving || groupsLoading;

    return (
        <div className="">
            <AssignmentForm
                mode="create"
                isLoading={isLoading}
                tests={tests}
                versions={versions}
                groups={groups}
                lessons={lessons}
                materials={materials}
                onCancel={() => router.back()}
                onSubmit={async (payload) => {
                    const created = await createAssignment(payload).unwrap();
                    router.push("/lms/teacher/test-management");
                    return created;
                }}
            />
        </div>
    );
}
