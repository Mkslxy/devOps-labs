"use client";

import { useRouter } from "next/navigation";
import { useCreateHomeWorkMutation } from "@/store/homework/homework.api";
import { HomeworkForm } from "@/components/lms/form/HomeWorkForm";

export default function AddHomeworkPage() {
    const router = useRouter();
    const [createHomework, { isLoading }] = useCreateHomeWorkMutation();

    return (
        <div className="p-4">
            <HomeworkForm
                mode="create"
                isLoading={isLoading}
                onCancel={() => router.back()}
                onSubmit={async (fd) => {
                    await createHomework(fd).unwrap();
                    router.push("/lms/teacher/homework");
                }}
            />
        </div>
    );
}
