import React, { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { AlertCircle, Edit, FolderOpen, Loader2, Plus, Trash2 } from "lucide-react";

import {
    useCreatePnlCategoryMutation,
    useDeletePnlCategoryMutation,
    useGetPnlCategoriesQuery,
    useLazyGetPnlCategoryByIdQuery,
    useUpdatePnlCategoryMutation,
} from "@/store/pnl/pnl.api";

import type { CategoryPayload } from "@/store/pnl/pnl.type";
import { useToast } from "@/hooks/use-toast";

type Props = { onSuccess?: () => void };

export default function PnlCategory({ onSuccess }: Props) {
    const { toast } = useToast();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [selectedId, setSelectedId] = useState<number>(0);
    const [name, setName] = useState("");
    const [page, setPage] = useState(1);

    const { data, isLoading, error } = useGetPnlCategoriesQuery({ page, ordering: "name" });

    const [createCategory, { isLoading: createLoading, error: createError }] =
        useCreatePnlCategoryMutation();

    const [updateCategory, { isLoading: updateLoading, error: updateError }] =
        useUpdatePnlCategoryMutation();

    const [deleteCategory, { isLoading: deleteLoading, error: deleteError }] =
        useDeletePnlCategoryMutation();

    const [getById, { data: byIdData, isLoading: byIdLoading }] =
        useLazyGetPnlCategoryByIdQuery();

    const totalPages = data ? Math.ceil(data.count / 10) : 0;

    const resetForm = () => {
        setSelectedId(0);
        setName("");
    };

    const openCreate = () => {
        resetForm();
        setCreateDialogOpen(true);
    };

    const openEdit = async (id: number) => {
        setSelectedId(id);
        try {
            const res = await getById({ id }).unwrap();
            setName(res?.name || "");
            setEditDialogOpen(true);
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося завантажити категорію",
                variant: "destructive",
            });
        }
    };

    const openDelete = async (id: number) => {
        setSelectedId(id);
        try {
            await getById({ id }).unwrap();
            setDeleteDialogOpen(true);
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося завантажити категорію",
                variant: "destructive",
            });
        }
    };

    const onCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload: CategoryPayload = { name: name.trim() };

        try {
            await createCategory(payload).unwrap();
            setCreateDialogOpen(false);
            resetForm();
            toast({ title: "Успішно", description: "Категорію створено" });
            onSuccess?.();
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося створити категорію",
                variant: "destructive",
            });
        }
    };

    const onUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        const dataPatch: Partial<CategoryPayload> = { name: name.trim() };

        try {
            await updateCategory({ id: selectedId, data: dataPatch }).unwrap();
            setEditDialogOpen(false);
            resetForm();
            toast({ title: "Успішно", description: "Категорію оновлено" });
            onSuccess?.();
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося оновити категорію",
                variant: "destructive",
            });
        }
    };

    const onDelete = async () => {
        try {
            await deleteCategory({ id: selectedId }).unwrap();
            setDeleteDialogOpen(false);
            setSelectedId(0);
            toast({ title: "Успішно", description: "Категорію видалено" });
            onSuccess?.();
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося видалити категорію",
                variant: "destructive",
            });
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col justify-between md:flex-row gap-3 md:gap-0">
                    <CardTitle className="text-lg">Категорії</CardTitle>

                    <Button onClick={openCreate} className="cursor-pointer w-full md:w-auto">
                        <Plus className="h-4 w-4" />
                        Додати категорію
                    </Button>
                </CardHeader>

                <CardContent>
                    {error ? (
                        <div className="text-center py-8 text-destructive">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            Помилка завантаження категорій
                        </div>
                    ) : isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                            Завантаження категорій...
                        </div>
                    ) : !data?.results?.length ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FolderOpen className="h-8 w-8 mx-auto mb-2" />
                            Категорій немає
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {data.results.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors"
                                    >
                                        <p className="font-medium truncate">{c.name || "Немає"}</p>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEdit(c.id)}
                                                className="h-8 w-8 cursor-pointer"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDelete(c.id)}
                                                className="h-8 w-8 text-destructive cursor-pointer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 ? (
                                <div className="flex justify-center items-center gap-4 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                        disabled={!data?.previous}
                                        className="cursor-pointer"
                                    >
                                        Назад
                                    </Button>

                                    <span className="text-sm">
                                        Сторінка {page} з {totalPages}
                                    </span>

                                    <Button
                                        variant="outline"
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={!data?.next}
                                        className="cursor-pointer"
                                    >
                                        Вперед
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Додати категорію</DialogTitle>
                        <DialogDescription>Введіть назву нової категорії</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={onCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name">Назва *</Label>
                            <Input
                                id="category-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Наприклад: Будинки"
                                required
                            />
                        </div>

                        {createError ? (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                Сталася помилка під час створення категорії
                            </div>
                        ) : null}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                                className="cursor-pointer"
                            >
                                Скасувати
                            </Button>
                            <Button type="submit" disabled={createLoading} className="cursor-pointer">
                                {createLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Створення...
                                    </>
                                ) : (
                                    "Додати"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Редагувати категорію</DialogTitle>
                        <DialogDescription>Змініть назву категорії</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={onUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name-edit">Назва *</Label>
                            <Input
                                id="category-name-edit"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Наприклад: Будинки"
                                required
                            />
                        </div>

                        {updateError ? (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                Сталася помилка під час оновлення категорії
                            </div>
                        ) : null}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditDialogOpen(false)}
                                className="cursor-pointer"
                            >
                                Скасувати
                            </Button>
                            <Button type="submit" disabled={updateLoading} className="cursor-pointer">
                                {updateLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Збереження...
                                    </>
                                ) : (
                                    "Зберегти"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Видалити категорію?</DialogTitle>
                        <DialogDescription>
                            Ця дія незворотна. Категорія буде видалена назавжди.
                        </DialogDescription>
                    </DialogHeader>

                    {byIdLoading ? (
                        <div className="flex justify-center items-center h-20">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                            <div className="font-bold text-lg mb-2">{byIdData?.name || "Немає"}</div>
                            <div className="text-sm text-muted-foreground">
                                Ви впевнені, що хочете видалити цю категорію?
                            </div>
                        </div>
                    )}

                    {deleteError ? (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                            Сталася помилка під час видалення категорії
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Скасувати
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onDelete}
                            disabled={deleteLoading}
                            className="cursor-pointer"
                        >
                            {deleteLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Видалення...
                                </>
                            ) : (
                                "Видалити"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
