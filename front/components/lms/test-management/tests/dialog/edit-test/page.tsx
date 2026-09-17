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

import type { TestCreatePayload, TestManagement } from "@/store/test-management/test-management.type";

type EditPayload = TestCreatePayload & { id: number };

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isSubmitting?: boolean;

    test: TestManagement | null;

    onSubmit: (payload: EditPayload) => Promise<void> | void;
};

export function TestEditDialog({
                                   open,
                                   onOpenChange,
                                   isSubmitting,
                                   test,
                                   onSubmit,
                               }: Props) {
    const form = useForm<TestCreatePayload>({
        defaultValues: { title: "", description: "" },
        mode: "onSubmit",
    });

    useEffect(() => {
        if (open && test) {
            form.reset({
                title: test.title ?? "",
                description: test.description ?? "",
            });
        }
        if (!open) {
            form.reset({ title: "", description: "" });
        }
    }, [open, test, form]);

    const handleSubmit = form.handleSubmit(async (values) => {
        if (!test) return;
        await onSubmit({ id: test.id, ...values });
        onOpenChange(false);
    });

    const disabled = isSubmitting || !test;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Редагувати тест</DialogTitle>
                    <DialogDescription>Онови назву та/або опис.</DialogDescription>
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
                                        <Input placeholder="Назва тесту" {...field} />
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
                                        <Textarea placeholder="Опис" rows={4} {...field} />
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
                                disabled={disabled}
                            >
                                Скасувати
                            </Button>
                            <Button type="submit" disabled={disabled}>
                                Зберегти
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}