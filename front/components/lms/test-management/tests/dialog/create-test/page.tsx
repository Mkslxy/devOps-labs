import React, { useEffect } from "react";
import { useForm } from "react-hook-form";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import type { TestCreatePayload } from "@/store/test-management/test-management.type";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isSubmitting?: boolean;
    onSubmit: (payload: TestCreatePayload) => Promise<void> | void;
};

export function TestCreateDialog({
                                     open,
                                     onOpenChange,
                                     isSubmitting,
                                     onSubmit,
                                 }: Props) {
    const form = useForm<TestCreatePayload>({
        defaultValues: { title: "", description: "" },
        mode: "onSubmit",
    });

    useEffect(() => {
        if (!open) form.reset({ title: "", description: "" });
    }, [open, form]);

    const handleSubmit = form.handleSubmit(async (values) => {
        await onSubmit(values);
        onOpenChange(false);
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Створити тест</DialogTitle>
                    <DialogDescription>Введи назву та опис.</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form className="grid gap-4" onSubmit={handleSubmit}>
                        <FormField
                            control={form.control}
                            name="title"
                            rules={{ required: "Назва обовʼязкова" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Назва</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Наприклад: Grammar A1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Опис</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Опціонально" rows={4} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Скасувати
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                Створити
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}