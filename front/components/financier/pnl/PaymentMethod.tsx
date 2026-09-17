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

import {
    AlertCircle,
    Banknote,
    CreditCard,
    Edit,
    FolderOpen,
    Loader2,
    Plus,
    Trash2,
    Wallet,
} from "lucide-react";

import {
    useCreatePnlPaymentMethodMutation,
    useDeletePnlPaymentMethodMutation,
    useGetPnlPaymentMethodsQuery,
    useLazyGetPnlPaymentMethodByIdQuery,
    useUpdatePnlPaymentMethodMutation,
} from "@/store/pnl/pnl.api";

import type { PaymentMethodPayload } from "@/store/pnl/pnl.type";
import { useToast } from "@/hooks/use-toast";

type Props = { onSuccess?: () => void };

export default function PnlPaymentMethod({ onSuccess }: Props) {
    const { toast } = useToast();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [selectedId, setSelectedId] = useState<number>(0);
    const [name, setName] = useState("");
    const [page, setPage] = useState(1);

    const { data, isLoading, error } = useGetPnlPaymentMethodsQuery({ page, ordering: "name" });

    const [createOne, { isLoading: createLoading, error: createError }] =
        useCreatePnlPaymentMethodMutation();

    const [updateOne, { isLoading: updateLoading, error: updateError }] =
        useUpdatePnlPaymentMethodMutation();

    const [deleteOne, { isLoading: deleteLoading, error: deleteError }] =
        useDeletePnlPaymentMethodMutation();

    const [getById, { data: byIdData, isLoading: byIdLoading }] =
        useLazyGetPnlPaymentMethodByIdQuery();

    const totalPages = data ? Math.ceil(data.count / 10) : 0;

    const getPaymentIcon = (id: number) => {
        const icons = [
            <CreditCard className="h-4 w-4" key="creditcard" />,
            <Wallet className="h-4 w-4" key="wallet" />,
            <Banknote className="h-4 w-4" key="banknote" />,
        ];
        return icons[id % icons.length];
    };

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
                description: "Не вдалося завантажити спосіб оплати",
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
                description: "Не вдалося завантажити спосіб оплати",
                variant: "destructive",
            });
        }
    };

    const onCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload: PaymentMethodPayload = { name: name.trim() };

        try {
            await createOne(payload).unwrap();
            setCreateDialogOpen(false);
            resetForm();
            toast({ title: "Успішно", description: "Спосіб оплати створено" });
            onSuccess?.();
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося створити спосіб оплати",
                variant: "destructive",
            });
        }
    };

    const onUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        const dataPatch: Partial<PaymentMethodPayload> = { name: name.trim() };

        try {
            await updateOne({ id: selectedId, data: dataPatch }).unwrap();
            setEditDialogOpen(false);
            resetForm();
            toast({ title: "Успішно", description: "Спосіб оплати оновлено" });
            onSuccess?.();
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося оновити спосіб оплати",
                variant: "destructive",
            });
        }
    };

    const onDelete = async () => {
        try {
            await deleteOne({ id: selectedId }).unwrap();
            setDeleteDialogOpen(false);
            setSelectedId(0);
            toast({ title: "Успішно", description: "Спосіб оплати видалено" });
            onSuccess?.();
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося видалити спосіб оплати",
                variant: "destructive",
            });
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col justify-between md:flex-row gap-3 md:gap-0">
                    <CardTitle className="text-lg">Способи оплати</CardTitle>

                    <Button onClick={openCreate} className="cursor-pointer w-full md:w-auto">
                        <Plus className="h-4 w-4" />
                        Додати спосіб оплати
                    </Button>
                </CardHeader>

                <CardContent>
                    {error ? (
                        <div className="text-center py-8 text-destructive">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            Помилка завантаження способів оплати
                        </div>
                    ) : isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                            Завантаження способів оплати...
                        </div>
                    ) : !data?.results?.length ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FolderOpen className="h-8 w-8 mx-auto mb-2" />
                            Способів оплати немає
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {data.results.map((m) => (
                                    <div
                                        key={m.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            {getPaymentIcon(m.id)}
                                            <p className="font-medium truncate">{m.name || "Немає"}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEdit(m.id)}
                                                className="h-8 w-8 cursor-pointer"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDelete(m.id)}
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
                        <DialogTitle>Додати спосіб оплати</DialogTitle>
                        <DialogDescription>Введіть назву нового способу оплати</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={onCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="pm-name">Назва *</Label>
                            <Input
                                id="pm-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Наприклад: Готівка"
                                required
                            />
                        </div>

                        {createError ? (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                Сталася помилка під час створення способу оплати
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
                        <DialogTitle>Редагувати спосіб оплати</DialogTitle>
                        <DialogDescription>Змініть назву способу оплати</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={onUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="pm-name-edit">Назва *</Label>
                            <Input
                                id="pm-name-edit"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Наприклад: Готівка"
                                required
                            />
                        </div>

                        {updateError ? (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                Сталася помилка під час оновлення способу оплати
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
                        <DialogTitle>Видалити спосіб оплати?</DialogTitle>
                        <DialogDescription>
                            Ця дія незворотна. Спосіб оплати буде видалено назавжди.
                        </DialogDescription>
                    </DialogHeader>

                    {byIdLoading ? (
                        <div className="flex justify-center items-center h-20">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                {byIdData?.id ? getPaymentIcon(byIdData.id) : null}
                                <div className="font-bold text-lg">{byIdData?.name || "Немає"}</div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Ви впевнені, що хочете видалити цей спосіб оплати?
                            </div>
                        </div>
                    )}

                    {deleteError ? (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                            Сталася помилка під час видалення способу оплати
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