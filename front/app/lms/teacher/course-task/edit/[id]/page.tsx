"use client";

import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { useGetTaskByIdQuery, usePartialUpdateTaskMutation } from "@/store/task-default/task-default.api";
import { TaskForm } from "@/components/lms/course-task/form/task-form";

export default function EditCourseTaskPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = Number(params.id);

    const { data, isLoading, isError } = useGetTaskByIdQuery(
        { id },
        {
            skip: !id,
            refetchOnMountOrArgChange: true,
        }
    );

    const [updateTask, { isLoading: isSaving }] = usePartialUpdateTaskMutation();

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
            <TaskForm
                mode="edit"
                initial={data}
                isLoading={isSaving}
                onCancel={() => router.back()}
                onSubmit={async (fd) => {
                    await updateTask({ id, data: fd }).unwrap();
                    router.push("/lms/teacher/course-task");
                }}
            />
        </div>
    );
}
