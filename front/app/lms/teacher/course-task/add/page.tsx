"use client";

import { useRouter } from "next/navigation";
import { useCreateTaskMutation } from "@/store/task-default/task-default.api";
import { TaskForm } from "@/components/lms/course-task/form/task-form";

export default function AddCourseTaskPage() {
    const router = useRouter();
    const [createTask, { isLoading }] = useCreateTaskMutation();

    return (
        <div className="p-4">
            <TaskForm
                mode="create"
                isLoading={isLoading}
                onCancel={() => router.back()}
                onSubmit={async (fd) => {
                    await createTask(fd).unwrap();
                    router.push("/lms/teacher/course-task");
                }}
            />
        </div>
    );
}