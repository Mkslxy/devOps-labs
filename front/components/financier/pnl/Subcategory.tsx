import React, { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
    useCreatePnlSubCategoryMutation,
    useDeletePnlSubCategoryMutation,
    useGetPnlCategoriesQuery,
    useGetPnlSubCategoriesQuery,
    useLazyGetPnlSubCategoryByIdQuery,
    useUpdatePnlSubCategoryMutation,
} from "@/store/pnl/pnl.api";

import type { SubCategoryPayload } from "@/store/pnl/pnl.type";
import { useToast } from "@/hooks/use-toast";

type Props = { onSuccess?: () => void };

export default function PnlSubcategory({ onSuccess }: Props) {
    const { toast } = useToast();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [selectedId, setSelectedId] = useState<number>(0);

    const [name, setName] = useState("");
    const [categoryId, setCategoryId] = useState<string>("");

    const [page, setPage] = useState(1);
    const [filterCategoryId, setFilterCategoryId] = useState<string>("all");

    const categoryFilter =
        filterCategoryId === "all" || filterCategoryId === "" ? undefined : Number(filterCategoryId);

    const { data: subData, isLoading: subLoading, error: subError } = useGetPnlSubCategoriesQuery({
        page,
        ordering: "name",
        ...(categoryFilter ? { category: categoryFilter } : {}),
    });

    const { data: catData, isLoading: catLoading } = useGetPnlCategoriesQuery({
        page: 1,
        ordering: "name",
    });

    const [createSub, { isLoading: createLoading, error: createError }] =
        useCreatePnlSubCategoryMutation();

    const [updateSub, { isLoading: updateLoading, error: updateError }] =
        useUpdatePnlSubCategoryMutation();

    const [deleteSub, { isLoading: deleteLoading, error: deleteError }] =
        useDeletePnlSubCategoryMutation();

    const [getById, { data: byIdData, isLoading: byIdLoading }] =
        useLazyGetPnlSubCategoryByIdQuery();

    const totalPages = subData ? Math.ceil(subData.count / 10) : 0;

    const resetForm = () => {
        setSelectedId(0);
        setName("");
        setCategoryId("");
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
            setCategoryId(res?.category?.id ? String(res.category.id) : "");
            setEditDialogOpen(true);
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося завантажити підкатегорію",
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
                description: "Не вдалося завантажити підкатегорію",
                variant: "destructive",
            });
        }
    };

    const onCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload: SubCategoryPayload = {
            name: name.trim(),
            category_id: Number(categoryId),
        };

        try {
            await createSub(payload).unwrap();
            setCreateDialogOpen(false);
            resetForm();
            toast({
                title: "Успішно",
                description: "Підкатегорію створено",
            });
            onSuccess?.();
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося створити підкатегорію",
                variant: "destructive",
            });
        }
    };

    const onUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        const data: Partial<SubCategoryPayload> = {
            name: name.trim(),
            category_id: Number(categoryId),
        };

        try {
            await updateSub({ id: selectedId, data }).unwrap();
            setEditDialogOpen(false);
            resetForm();
            toast({
                title: "Успішно",
                description: "Підкатегорію оновлено",
            });
            onSuccess?.();
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося оновити підкатегорію",
                variant: "destructive",
            });
        }
    };

    const onDelete = async () => {
        try {
            await deleteSub({ id: selectedId }).unwrap();
            setDeleteDialogOpen(false);
            setSelectedId(0);
            toast({
                title: "Успішно",
                description: "Підкатегорію видалено",
            });
            onSuccess?.();
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося видалити підкатегорію",
                variant: "destructive",
            });
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col gap-5 md:gap-0 md:flex-row justify-between space-y-0">
                    <div className="flex flex-col md:flex-row gap-3 md:items-center">
                        <CardTitle className="text-lg">Підкатегорії</CardTitle>

                        <Select
                            value={filterCategoryId}
                            onValueChange={(v) => {
                                setFilterCategoryId(v);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full md:w-auto">
                                <SelectValue placeholder="Всі категорії" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Всі категорії</SelectItem>
                                {catLoading ? (
                                    <SelectItem value="loading" disabled>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Завантаження...
                                    </SelectItem>
                                ) : (
                                    catData?.results?.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name || "Немає"}
                                        </SelectItem>
                                    )) || []
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={openCreate} className="cursor-pointer w-full md:w-auto">
                        <Plus className="h-4 w-4" />
                        Додати підкатегорію
                    </Button>
                </CardHeader>

                <CardContent>
                    {subError ? (
                        <div className="text-center py-8 text-destructive">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            Помилка завантаження підкатегорій
                        </div>
                    ) : subLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                            Завантаження підкатегорій...
                        </div>
                    ) : !subData?.results?.length ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FolderOpen className="h-8 w-8 mx-auto mb-2" />
                            Підкатегорій немає
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {subData.results.map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{s.name || "Немає"}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {s.category?.name || "Немає"}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEdit(s.id)}
                                                className="h-8 w-8 cursor-pointer"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDelete(s.id)}
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
                                        disabled={!subData?.previous}
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
                                        disabled={!subData?.next}
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
                        <DialogTitle>Додати підкатегорію</DialogTitle>
                        <DialogDescription>
                            Введіть назву нової підкатегорії та оберіть категорію
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={onCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sub-name">Назва *</Label>
                            <Input
                                id="sub-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Наприклад: Квартири"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Категорія *</Label>
                            <Select value={categoryId} onValueChange={setCategoryId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Оберіть категорію" />
                                </SelectTrigger>
                                <SelectContent>
                                    {catLoading ? (
                                        <SelectItem value="loading" disabled>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Завантаження...
                                        </SelectItem>
                                    ) : (
                                        catData?.results?.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name || "Немає"}
                                            </SelectItem>
                                        )) || []
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {createError ? (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                Сталася помилка під час створення підкатегорії
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
                            <Button type="submit" disabled={createLoading || catLoading} className="cursor-pointer">
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
                        <DialogTitle>Редагувати підкатегорію</DialogTitle>
                        <DialogDescription>Змініть назву підкатегорії та категорію</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={onUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sub-name-edit">Назва *</Label>
                            <Input
                                id="sub-name-edit"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Наприклад: Квартири"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Категорія *</Label>
                            <Select value={categoryId} onValueChange={setCategoryId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Оберіть категорію" />
                                </SelectTrigger>
                                <SelectContent>
                                    {catLoading ? (
                                        <SelectItem value="loading" disabled>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Завантаження...
                                        </SelectItem>
                                    ) : (
                                        catData?.results?.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name || "Немає"}
                                            </SelectItem>
                                        )) || []
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {updateError ? (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                Сталася помилка під час оновлення підкатегорії
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
                            <Button type="submit" disabled={updateLoading || catLoading} className="cursor-pointer">
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
                        <DialogTitle>Видалити підкатегорію?</DialogTitle>
                        <DialogDescription>
                            Ця дія незворотна. Підкатегорія буде видалена назавжди.
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
                                Категорія: {byIdData?.category?.name || "Немає"}
                            </div>
                        </div>
                    )}

                    {deleteError ? (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                            Сталася помилка під час видалення підкатегорії
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