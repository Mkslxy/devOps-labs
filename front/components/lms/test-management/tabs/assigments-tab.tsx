import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeaderSection } from "../header-section";
import { ListState } from "../list-state";

import { DeleteAssignmentDialog } from "@/components/lms/test-management/dialog/delete-assignment/page";

type Props = {
    assignments: any[];
    loading?: boolean;

    onDelete?: (id: number) => Promise<any> | void;
    deletingId?: number | null;
};

export function AssignmentsTab({
                                   assignments,
                                   loading,
                                   onDelete,
                                   deletingId,
                               }: Props) {
    const router = useRouter();

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const onCreate = () => router.push("/lms/teacher/test-management/assignments/add");
    const onEdit = (id: number) => router.push(`/lms/teacher/test-management/assignments/edit/${id}/`);

    const openDelete = (id: number) => {
        setDeleteId(id);
        setDeleteOpen(true);
    };

    const closeDelete = () => {
        setDeleteOpen(false);
        setDeleteId(null);
    };

    return (
        <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
                <HeaderSection
                    title="Призначення"
                    description="Привʼязка версії теста до матеріалів/груп/уроків і т.д."
                    actionLabel="Створити призначення"
                    actionVariant="default"
                    actionIcon={<Plus className="w-4 h-4 mr-2" />}
                    onAction={onCreate}
                >
                    <ScrollArea className="h-[560px]">
                        <div className="p-3 grid gap-2">
                            <ListState
                                loading={loading}
                                empty={!loading && assignments.length === 0}
                                emptyText="Призначень ще немає."
                                loadingText="Завантаження призначень..."
                            >
                                {assignments.map((a: any) => (
                                    <div
                                        key={a.id}
                                        className=" rounded-lg border bg-card px-3 py-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium truncate">
                                                {a.test?.title ?? "Немає"} • версія #{a.pinned_version?.id ?? "Немає"}
                                            </div>

                                            <div className="text-xs text-muted-foreground truncate">
                                                {a.material?.title ? `Матеріал: ${a.material.title}` : "Матеріал: Немає"} •{" "}
                                                {a.lesson?.topic ? `Урок: ${a.lesson.topic}` : "Урок: Немає"}
                                            </div>

                                            <div className="mt-2 text-xs text-muted-foreground">
                                                Закривається:{" "}
                                                {a.closing_at
                                                    ? format(new Date(a.closing_at), "dd.MM.yyyy HH:mm", { locale: uk })
                                                    : "Немає"}
                                            </div>
                                        </div>

                                        <div className=" flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:min-w-[260px]">
                                            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                                                <Badge variant="secondary" className="rounded-full hidden sm:flex">
                                                    #{a.id}
                                                </Badge>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onEdit(a.id)}
                                                    className="cursor-pointer w-full sm:w-[120px]"
                                                >
                                                    Редагувати
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => openDelete(a.id)}
                                                    className="cursor-pointer w-full sm:w-[120px]"
                                                >
                                                    Видалити
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </ListState>
                        </div>
                    </ScrollArea>
                </HeaderSection>

                <DeleteAssignmentDialog
                    open={deleteOpen}
                    assignmentId={deleteId}
                    loading={deletingId === deleteId}
                    onClose={closeDelete}
                    onConfirm={async (id) => {
                        await onDelete?.(id);
                        closeDelete();
                    }}
                />
            </div>
        </div>
    );
}
