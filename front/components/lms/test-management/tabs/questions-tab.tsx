import React, {useState} from "react";
import {Plus} from "lucide-react";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Button} from "@/components/ui/button";
import {HeaderSection} from "../header-section";
import {ListState} from "../list-state";
import {TYPE_LABELS} from "@/store/test-management/test-management.labels";
import {useRouter} from "next/navigation";
import {DeleteQuestionDialog} from "@/components/lms/test-management/dialog/delete-question/page";

type Props = {
    questions: any[];
    loading?: boolean;
    onCreate?: () => void;
    onEdit?: (id: number) => void;
};

export function QuestionsTab({questions, loading}: Props) {
    const router = useRouter();

    const onCreate = () => router.push("/lms/teacher/test-management/questions/add");
    const onEdit = (id: number) => router.push(`/lms/teacher/test-management/questions/edit/${id}/`);

    const [deleteId, setDeleteId] = useState<number | null>(null);


    return (
        <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
                <HeaderSection
                    title="Банк питань"
                    description="Створення ,редагування ,читання ,видалення питань. Версії тестів лише додають питання."
                    actionLabel="Додати питання"
                    actionVariant="default"
                    actionIcon={<Plus className="w-4 h-4 mr-2"/>}
                    onAction={onCreate}
                >
                    <ScrollArea className="h-[560px]">
                        <div className="p-3 grid gap-2">
                            <ListState
                                loading={loading}
                                empty={!loading && questions.length === 0}
                                emptyText="Питань ще немає."
                                loadingText="Завантаження питань..."
                            >
                                {questions.map((q: any) => (
                                    <div
                                        key={q.id}
                                        className="rounded-lg border bg-card px-3 py-2 flex items-start justify-between gap-3"
                                    >
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate">
                                                {q.title ?? q.text ?? "немає"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {q.type ? TYPE_LABELS[q.type as keyof typeof TYPE_LABELS] : "Тип: немає"}
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onEdit?.(q.id)}
                                                className="cursor-pointer w-[90px] md:w-[100px]"
                                            >
                                                Редагувати
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => setDeleteId(q.id)}
                                                className="cursor-pointer w-[90px] md:w-[100px]"
                                            >
                                                <span className="inline">Видалити</span>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </ListState>
                        </div>
                    </ScrollArea>
                </HeaderSection>

                <DeleteQuestionDialog
                    open={deleteId !== null}
                    questionId={deleteId}
                    onClose={() => setDeleteId(null)}
                />
            </div>
        </div>
    );
}
