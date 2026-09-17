"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import MaterialForm from "@/components/lms/form/MaterialForm";
import {
    useGetMaterialByIdQuery,
    useUpdateMaterialMutation,
} from "@/store/material/material.api";

export default function MaterialEditPage() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);

    const { data: material, isLoading } = useGetMaterialByIdQuery(id, { skip: !id });
    const [updateMaterial, { isLoading: isSaving }] = useUpdateMaterialMutation();

    if (!id) return <div>Невірний id</div>;
    if (isLoading) return <div>Завантаження...</div>;
    if (!material) return <div>Матеріал не знайдено</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-row gap-5 items-center">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Редагувати матеріал</h1>
            </div>

            <MaterialForm
                initial={material}
                submitText={isSaving ? "Збереження..." : "Зберегти"}
                onCancel={() => router.back()}
                onSubmit={async (payload) => {
                    await updateMaterial({ id, data: payload }).unwrap();
                    router.push("/lms/teacher/courses");
                }}
            />
        </div>
    );
}
