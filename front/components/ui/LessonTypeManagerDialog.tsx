import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

import {
    useGetLessonTypesQuery,
    useCreateLessonTypeMutation,
    useUpdateLessonTypeMutation,
    useDeleteLessonTypeMutation,
} from "@/store/lessons/lesson.api";

import {
    type LessonType,
} from "@/store/lessons/lesson.type"

const schema = z.object({
    name: z.string().min(1, "Назва обовʼязкова"),
    slug: z.string().min(1, "Проміжок обовʼязковий"),
    duration_minutes: z.coerce.number().int().positive("Тривалість має бути більше 0"),
});

type FormValues = z.infer<typeof schema>;

export function LessonTypeManagerDialog({
                                            open,
                                            onOpenChange,
                                            onPick,
                                        }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onPick?: (id: number) => void;
}) {
    const { data, isLoading } = useGetLessonTypesQuery();
    const [createType, { isLoading: isCreating }] = useCreateLessonTypeMutation();
    const [updateType, { isLoading: isUpdating }] = useUpdateLessonTypeMutation();
    const [deleteType, { isLoading: isDeleting }] = useDeleteLessonTypeMutation();

    const [editing, setEditing] = useState<LessonType | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: "", slug: "", duration_minutes: 60 },
    });

    const submitText = editing ? "Зберегти" : "Створити";

    const onSubmit = async (values: FormValues) => {
        if (editing) {
            const updated = await updateType({ id: editing.id, data: values }).unwrap();
            setEditing(null);
            form.reset({ name: "", slug: "", duration_minutes: 60 });
            onPick?.(updated.id);
            return;
        }

        const created = await createType(values).unwrap();
        form.reset({ name: "", slug: "", duration_minutes: 60 });
        onPick?.(created.id);
    };

    const startEdit = (item: LessonType) => {
        setEditing(item);
        form.reset({
            name: item.name,
            slug: item.slug,
            duration_minutes: item.duration_minutes,
        });
    };

    const cancelEdit = () => {
        setEditing(null);
        form.reset({ name: "", slug: "", duration_minutes: 60 });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[850px]">
                <DialogHeader>
                    <DialogTitle>Керування типами уроків</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                            {isLoading ? "Завантаження..." : "Список типів уроків"}
                        </div>

                        <div className="border rounded-md divide-y max-h-[420px] overflow-auto">
                            {data?.results?.map((t) => (
                                <div key={t.id} className="p-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="font-medium truncate">{t.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {t.slug} • {t.duration_minutes} хв
                                        </div>
                                    </div>

                                    <div className="flex gap-2 shrink-0">
                                        <Button type="button" variant="outline" size="sm" onClick={() => onPick?.(t.id)}>
                                            Обрати
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => startEdit(t)}>
                                            Редагувати
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            disabled={isDeleting}
                                            onClick={async () => {
                                                await deleteType(t.id).unwrap();
                                                if (editing?.id === t.id) cancelEdit();
                                            }}
                                        >
                                            Видалити
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Назва</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Напр. Англ. мова" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Проміжок уроку</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Довгий урок" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="duration_minutes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Тривалість (хв)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="60" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-2">
                                    <Button type="submit" disabled={isCreating || isUpdating}>
                                        {submitText}
                                    </Button>

                                    {editing && (
                                        <Button type="button" variant="outline" onClick={cancelEdit}>
                                            Скасувати редагування
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
