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
import { useCreateTopicMutation } from "@/store/topic/topic.api";

export function CreateTopicDialog() {
    const [open, setOpen] = useState(false);
    const [createTopic, { isLoading }] = useCreateTopicMutation();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="cursor-pointer">+ Додати тему</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Нова тема</DialogTitle>
                </DialogHeader>

                <TopicForm
                    submitText="Створити"
                    loading={isLoading}
                    onCancel={() => setOpen(false)}
                    onSubmit={async (payload) => {
                        await createTopic(payload).unwrap();
                        setOpen(false);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
