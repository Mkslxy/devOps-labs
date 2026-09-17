"use client";

import { useRouter } from "next/navigation";
import GroupForm from "@/components/manager/form/GroupForm";
import {Button} from "@/components/ui/button";
import {ArrowLeft} from "lucide-react";
import React from "react";

export default function AddGroupPage() {
    const router = useRouter();

    return (
        <div>
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
                        Додати групу
                    </h1>
                </div>

                <GroupForm
                    onSubmitSuccess={() =>
                        router.push("/dashboard/manager/groups")
                    }
                />
            </div>

        </div>
    );
}
