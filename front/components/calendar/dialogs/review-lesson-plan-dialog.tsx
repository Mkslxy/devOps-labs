"use client";

import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";

import {
    LessonPlanReviewAction,
    type LessonPlanReviewPayload,
} from "@/store/lessons/lesson.type";
import { useReviewLessonPlanMutation } from "@/store/lessons/lesson.api";

type Props = {
    lessonId: number;
    lessonPlan?: string | null;
    trigger: ReactNode;
};

export function ReviewLessonPlanDialog({ lessonId, lessonPlan, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [feedback, setFeedback] = useState("");

    const [reviewLessonPlan, { isLoading }] = useReviewLessonPlanMutation();

    const trimmedFeedback = useMemo(() => feedback.trim(), [feedback]);
    const planText = (lessonPlan ?? "").trim();

    async function submit(action: LessonPlanReviewAction) {
        const payload: LessonPlanReviewPayload = trimmedFeedback
            ? { action, feedback: trimmedFeedback }
            : { action };

        try {
            await reviewLessonPlan({ id: lessonId, data: payload }).unwrap();
            setOpen(false);
            setFeedback("");
        } catch (e) {
            console.error("Не вдалося перевірити план уроку:", e);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>

            <DialogContent className="max-w-[525px] max-h-[600px] overflow-x-auto">
                <DialogHeader>
                    <DialogTitle>Перевірка плану уроку</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <Card className="p-3">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">План уроку</p>

                            <ScrollArea className="h-[150px] w-[350px] break-all rounded-md border bg-background">
                                <div className="p-3">
                                    {planText ? (
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {planText}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Немає</p>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </Card>

                    <Card className="p-3">
                        <div className="space-y-2">
                            <Label htmlFor="lesson-plan-feedback">Коментар (необовʼязково)</Label>
                            <Textarea
                                id="lesson-plan-feedback"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Наприклад: додай мету уроку, уточни таймінги, прикріпи матеріали…"
                                rows={4}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Якщо коментар порожній — буде надіслано лише дію.
                            </p>
                        </div>
                    </Card>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => submit(LessonPlanReviewAction.approve)}
                    >
                        Схвалити
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        disabled={isLoading}
                        onClick={() => submit(LessonPlanReviewAction.reject)}
                    >
                        Відхилити
                    </Button>

                    <DialogClose asChild>
                        <Button type="button" variant="secondary" disabled={isLoading}>
                            Закрити
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}