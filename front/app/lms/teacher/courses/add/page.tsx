"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import React from "react";

import MaterialForm from "@/components/lms/form/MaterialForm";
import { useCreateMaterialMutation } from "@/store/material/material.api";

export default function AddMaterialPage() {
    const router = useRouter();
    const [createMaterial, { isLoading }] = useCreateMaterialMutation();

    return (
        <div className="space-y-6">
            <div className="flex flex-row gap-5 items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                <h1 className="text-2xl font-bold">Додати матеріал</h1>
            </div>

            <MaterialForm
                submitText={isLoading ? "Створення..." : "Створити"}
                onCancel={() => router.back()}
                onSubmit={async (payload) => {
                    await createMaterial(payload).unwrap();
                    router.push("/lms/teacher/courses");
                }}
            />
        </div>
    );
}
