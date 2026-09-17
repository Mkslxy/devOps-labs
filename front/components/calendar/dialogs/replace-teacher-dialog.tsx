import {ReactNode, useState} from "react";

import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

import {
    useGetAvailableTeachersByLessonIdQuery,
    useUpdateLessonMutation,
} from "@/store/lessons/lesson.api";

export function ReplaceTeacherDialog({
                                  lessonId,
                                  currentTeacherId,
                                  trigger,
                              }: {
    lessonId: number;
    currentTeacherId?: number | null;
    trigger: ReactNode;
}) {
    const { data, isFetching, isError } = useGetAvailableTeachersByLessonIdQuery(lessonId);
    const [updateLesson, { isLoading }] = useUpdateLessonMutation();
    const [open, setOpen] = useState(false);
    const teachers = data ?? [];
    const [teacherId, setTeacherId] = useState<string>("");

    const canSubmit =
        teacherId !== "" &&
        teacherId !== "__empty__" &&
        Number(teacherId) !== (currentTeacherId ?? -1) &&
        !isLoading;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>

            <DialogContent className="pt-5 pb-0 px-4">
                <DialogHeader>
                    <DialogTitle>Замінити викладача</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 p-4">
                    <Card className="p-3">
                        <div className="flex items-start gap-2">
                            <Users className="mt-1 size-4 shrink-0 text-muted-foreground" />
                            <div className="w-full space-y-2">
                                <Label className="text-sm font-medium">Доступні викладачі</Label>

                                {isError ? (
                                    <p className="text-sm text-destructive">Не вдалося завантажити список</p>
                                ) : (
                                    <Select value={teacherId} onValueChange={setTeacherId} disabled={isFetching}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={isFetching ? "Завантажуємо..." : "Оберіть викладача"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teachers.length === 0 ? (
                                                <SelectItem value="__empty__" disabled>
                                                    Немає
                                                </SelectItem>
                                            ) : (
                                                teachers.map((t) => (
                                                    <SelectItem key={t.id} value={String(t.id)}>
                                                        {t.full_name ?? "Немає"}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    Поточного викладача можна обрати тільки якщо він є у списку.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                <DialogFooter className="px-4 pb-4">
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isLoading}>
                            Закрити
                        </Button>
                    </DialogClose>

                    <Button
                        disabled={!canSubmit}
                        onClick={async () => {
                            await updateLesson({
                                id: lessonId,
                                data: { teacher_id: Number(teacherId) },
                            }).unwrap();

                            setOpen(false);
                            setTeacherId("");
                        }}
                    >
                        Підтвердити
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
