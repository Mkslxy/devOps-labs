"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuestionForm } from "@/components/lms/test-management/questions/question-form";
import {
    useGetQuestionByIdQuery,
    useUpdateQuestionMutation,
} from "@/store/test-management/test-management.api";

export default function EditQuestionPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();

    const id = useMemo(() => Number(params.id), [params.id]);

    const { data, isLoading } = useGetQuestionByIdQuery(id, { skip: !id });
    const [updateQuestion, { isLoading: isSaving }] = useUpdateQuestionMutation();

    return (
        <div className="p-6">
            <QuestionForm
                mode="edit"
                initialQuestion={data}
                isLoading={isLoading || isSaving}
                onCancel={() => router.back()}
                onSubmit={async (payload) => {
                    await updateQuestion({ id, data: payload }).unwrap();
                    router.push("/lms/teacher/test-management");
                }}
            />
        </div>
    );
}