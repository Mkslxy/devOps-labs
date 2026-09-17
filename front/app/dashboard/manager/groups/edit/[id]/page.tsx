"use client";

import { useRouter, useParams } from "next/navigation";
import GroupForm from "@/components/manager/form/GroupForm";
import { useGetGroupByIdQuery } from "@/store/groups/group.api";
import {ArrowLeft, Loader2} from "lucide-react";
import {Button} from "@/components/ui/button";

export default function EditGroupPage() {
    const router = useRouter();
    const params = useParams();
    const groupId = Number(params.id);

    const { data, isLoading, isError } = useGetGroupByIdQuery(groupId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError || !data) {
        return <div>Групу не знайдено</div>;
    }

    return (
        <div className="space-y-6">

            <div className="flex flex-row gap-5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">
                    Редагувати групу
                </h1>
            </div>

            <GroupForm
                groupId={groupId}
                initialData={data}
                onSubmitSuccess={() =>
                    router.push("/dashboard/manager/groups")
                }
            />
        </div>
    );
}
