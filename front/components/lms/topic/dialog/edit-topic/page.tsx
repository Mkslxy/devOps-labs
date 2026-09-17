"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import TopicForm from "@/components/lms/topic/form/TopicForm";
import type { Topic } from "@/store/topic/topic.type";
import { useUpdateTopicMutation } from "@/store/topic/topic.api";

export function EditTopicDialog({ topic }: { topic: Topic }) {
    const [open, setOpen] = useState(false);
    const [updateTopic, { isLoading }] = useUpdateTopicMutation();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer w-[90px] 2xl:w-[111px]"
                    variant="outline"
                >
                    Редагувати
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Редагувати тему</DialogTitle>
                </DialogHeader>

                <TopicForm
                    initial={topic}
                    submitText="Зберегти"
                    loading={isLoading}
                    onCancel={() => setOpen(false)}
                    onSubmit={async (payload) => {
                        await updateTopic({ id: topic.id, data: payload }).unwrap();
                        setOpen(false);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
