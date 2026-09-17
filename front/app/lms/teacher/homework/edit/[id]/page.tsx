"use client";

import { useParams, useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";

import {useGetHomeWorkByIdQuery, useUpdateHomeWorkMutation} from "@/store/homework/homework.api";
import {HomeworkForm} from "@/components/lms/form/HomeWorkForm";

export default function EditHomeworkPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = Number(params.id);

    const { data, isLoading, isError } = useGetHomeWorkByIdQuery(id, {
        skip: !id,
        refetchOnMountOrArgChange: true,
    });

    const [updateHomework, { isLoading: isSaving }] = useUpdateHomeWorkMutation();

    if (isLoading) {
        return (
            <div className="p-4">
                <Card className="p-4">Завантаження...</Card>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="p-4">
                <Card className="p-4">Немає</Card>
            </div>
        );
    }

    return (
        <div className="p-4">
            <HomeworkForm
                mode="edit"
                initial={data}
                isLoading={isSaving}
                onCancel={() => router.back()}
                onSubmit={async (fd) => {
                    await updateHomework({ id, data: fd }).unwrap();
                    router.push("/lms/teacher/homework");
                }}
            />

        </div>
    );
}
