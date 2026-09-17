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
    useCreatePnlCurrencyMutation,
    useDeletePnlCurrencyMutation,
    useGetPnlCurrenciesQuery,
    useLazyGetPnlCurrencyByIdQuery,
    useUpdatePnlCurrencyMutation,
} from "@/store/pnl/pnl.api";

import type { CurrencyPayload } from "@/store/pnl/pnl.type";
import { useToast } from "@/hooks/use-toast";

type PnlCurrencyProps = { onSuccess?: () => void };

export default function PnlCurrency({ onSuccess }: PnlCurrencyProps) {
    const { toast } = useToast();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [selectedCurrencyId, setSelectedCurrencyId] = useState(0);
    const [page, setPage] = useState(1);

    const [form, setForm] = useState<CurrencyPayload>({
        code: "",
        name: "",
        symbol: "",
    });

    const { data: AllCurrencies, isLoading: CurrenciesLoading, error: CurrenciesError } =
        useGetPnlCurrenciesQuery({ page, ordering: "name" });

    const [createCurrency, { isLoading: createLoading, error: createError }] =
        useCreatePnlCurrencyMutation();

    const [updateCurrency, { isLoading: updateLoading, error: updateError }] =
        useUpdatePnlCurrencyMutation();

    const [deleteCurrency, { isLoading: deleteLoading, error: deleteError }] =
        useDeletePnlCurrencyMutation();

    const [getById, { data: currencyData }] = useLazyGetPnlCurrencyByIdQuery();

    const totalPages = AllCurrencies ? Math.ceil(AllCurrencies.count / 10) : 0;

    const resetForm = () => {
        setSelectedCurrencyId(0);
        setForm({ code: "", name: "", symbol: "" });
    };

    const handleOpenAddDialog = () => {
        resetForm();
        setCreateDialogOpen(true);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload: CurrencyPayload = {
            code: form.code.trim(),
            name: form.name.trim(),
            symbol: form.symbol.trim(),
        };

        try {
            await createCurrency(payload).unwrap();
            setCreateDialogOpen(false);
            resetForm();
            toast({ title: "Успішно", description: "Валюту створено" });
            onSuccess?.();
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося створити валюту",
                variant: "destructive",
            });
        }
    };

    const handleEdit = async (id: number) => {
        setSelectedCurrencyId(id);
        try {
            const res = await getById({ id }).unwrap();
            setForm({
                code: res.code || "",
                name: res.name || "",
                symbol: res.symbol || "",
            });
            setEditDialogOpen(true);
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося завантажити валюту",
                variant: "destructive",
            });
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        const data: Partial<CurrencyPayload> = {
            code: form.code.trim(),
            name: form.name.trim(),
            symbol: form.symbol.trim(),
        };

        try {
            await updateCurrency({ id: selectedCurrencyId, data }).unwrap();
            setEditDialogOpen(false);
            resetForm();
            toast({ title: "Успішно", description: "Валюту оновлено" });
            onSuccess?.();
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося оновити валюту",
                variant: "destructive",
            });
        }
    };

    const handleOpenDelete = async (id: number) => {
        setSelectedCurrencyId(id);
        try {
            await getById({ id }).unwrap();
            setDeleteDialogOpen(true);
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося завантажити валюту",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteCurrency({ id: selectedCurrencyId }).unwrap();
            setDeleteDialogOpen(false);
            setSelectedCurrencyId(0);
            toast({ title: "Успішно", description: "Валюту видалено" });
            onSuccess?.();
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося видалити валюту",
                variant: "destructive",
            });
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col justify-between md:flex-row gap-3 md:items-center">
                    <CardTitle className="text-lg">Валюти</CardTitle>
                    <Button onClick={handleOpenAddDialog} className="cursor-pointer w-full md:w-auto">
                        <Plus className="h-4 w-4" />
                        Додати валюту
                    </Button>
                </CardHeader>

                <CardContent>
                    {CurrenciesError ? (
                        <div className="text-center py-8 text-destructive">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            Помилка завантаження валют
                        </div>
                    ) : CurrenciesLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                            Завантаження валют...
                        </div>
                    ) : !AllCurrencies?.results || AllCurrencies.results.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FolderOpen className="h-8 w-8 mx-auto mb-2" />
                            Валют немає
                        </div>
                    ) : (
                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {AllCurrencies.results.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">
                                                {c.name || "Немає"} ({c.code || "Немає"}) {c.symbol || ""}
                                            </p>
                                            <p className="text-xs text-muted-foreground">ID: {c.id}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(c.id)}
                                                className="h-8 w-8 cursor-pointer"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDelete(c.id)}
                                                className="h-8 w-8 text-destructive cursor-pointer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 ? (
                                <div className="flex justify-center items-center gap-4 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={!AllCurrencies.previous}
                                        className="cursor-pointer"
                                    >
                                        Назад
                                    </Button>
                                    <span className="text-sm">
                                        Сторінка {page} з {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage((prev) => prev + 1)}
                                        disabled={!AllCurrencies.next}
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
                        <DialogTitle>Додати валюту</DialogTitle>
                        <DialogDescription>Введіть дані валюти</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Код *</Label>
                            <Input
                                value={form.code}
                                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                                placeholder="UAH"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Назва *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Гривня"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Символ *</Label>
                            <Input
                                value={form.symbol}
                                onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))}
                                placeholder="₴"
                                required
                            />
                        </div>

                        {createError ? (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                Сталася помилка під час створення валюти
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
                        <DialogTitle>Редагувати валюту</DialogTitle>
                        <DialogDescription>Змініть дані валюти</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Код *</Label>
                            <Input
                                value={form.code}
                                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Назва *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Символ *</Label>
                            <Input
                                value={form.symbol}
                                onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))}
                                required
                            />
                        </div>

                        {updateError ? (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                Сталася помилка під час оновлення валюти
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
                        <DialogTitle>Видалити валюту?</DialogTitle>
                        <DialogDescription>
                            Ця дія незворотна. Валюта буде видалена назавжди.
                        </DialogDescription>
                    </DialogHeader>

                    {currencyData ? (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                            <div className="font-bold text-lg mb-2">
                                {currencyData.name || "Немає"} ({currencyData.code || "Немає"}) {currencyData.symbol || ""}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Ви впевнені, що хочете видалити цю валюту?
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-20">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    )}

                    {deleteError ? (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                            Сталася помилка під час видалення валюти
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
                            onClick={handleDelete}
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