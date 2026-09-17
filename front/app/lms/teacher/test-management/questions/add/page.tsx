"use client";

import { useRouter } from "next/navigation";
import { QuestionForm } from "@/components/lms/test-management/questions/question-form";
import { useCreateQuestionMutation } from "@/store/test-management/test-management.api";
import React from "react";

export default function AddQuestionPage() {
    const router = useRouter();
    const [createQuestion, { isLoading }] = useCreateQuestionMutation();

    return (
        <div className="p-0">
            <QuestionForm
                mode="create"
                isLoading={isLoading}
                onCancel={() => router.back()}
                onSubmit={async (payload) => {
                    await createQuestion(payload).unwrap();
                    router.push("/lms/teacher/test-management");
                }}
            />
        </div>
    );
}
