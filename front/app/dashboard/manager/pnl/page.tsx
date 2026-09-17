"use client";

import type React from "react";
import {useMemo, useState} from "react";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
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

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
    AlertCircle,
    Banknote,
    Calendar,
    CreditCard,
    Edit,
    Filter,
    FolderOpen,
    Loader2,
    Plus,
    Trash2,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";

import {
    useCreatePnlTransactionMutation,
    useDeletePnlTransactionMutation,
    useGetPnlCategoriesQuery,
    useGetPnlCurrenciesQuery,
    useGetPnlPaymentMethodsQuery,
    useGetPnlSubCategoriesQuery,
    useGetPnlTransactionsQuery,
    useLazyGetPnlTransactionByIdQuery,
    useUpdatePnlTransactionMutation,
} from "@/store/pnl/pnl.api";

import {TransactionTypeEnum} from "@/store/pnl/pnl.type";
import {STATUS_LABELS} from "@/store/pnl/pnl.label";
import PnlCurrency from "@/components/financier/pnl/Currency";
import {ResponsiveList} from "@/components/ui/ResponsiveList";
import {useToast} from "@/hooks/use-toast";
import PnlPaymentMethod from "@/components/financier/pnl/PaymentMethod";
import PnlCategory from "@/components/financier/pnl/Category";
import PnlSubcategory from "@/components/financier/pnl/Subcategory";
import {useGetSchoolsQuery} from "@/store/school/school.api";

type TransactionFormState = {
    category_id: string;
    subcategory_id: string;
    payment_method_id: string;
    currency_id: string;
    school_id: string;
    amount: string;
    type: TransactionTypeEnum;
    description: string;
};

const DEFAULT_FORM: TransactionFormState = {
    category_id: "",
    subcategory_id: "",
    payment_method_id: "",
    currency_id: "",
    school_id: "",
    amount: "",
    type: TransactionTypeEnum.expense,
    description: "",
};

export default function FinancePNLPage() {
    const {toast} = useToast();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [selectedTransactionId, setSelectedTransactionId] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(1);

    const [transactionData, setTransactionData] = useState<TransactionFormState>(DEFAULT_FORM);
    const [editTransactionData, setEditTransactionData] = useState<TransactionFormState>(DEFAULT_FORM);

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const [selectedType, setSelectedType] = useState<string>("all");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedCurrency, setSelectedCurrency] = useState<string>("all");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("all");

    const created_at_after = startDate ? startDate.toISOString() : undefined;
    const created_at_before = endDate ? endDate.toISOString() : undefined;

    const typeFilter =
        selectedType === "all" || selectedType === ""
            ? undefined
            : (selectedType as TransactionTypeEnum);

    const categoryFilter =
        selectedCategory === "all" || selectedCategory === ""
            ? undefined
            : Number(selectedCategory);

    const currencyFilter =
        selectedCurrency === "all" || selectedCurrency === ""
            ? undefined
            : Number(selectedCurrency);

    const paymentMethodFilter =
        selectedPaymentMethod === "all" || selectedPaymentMethod === ""
            ? undefined
            : Number(selectedPaymentMethod);

    const {data: AllCategories} = useGetPnlCategoriesQuery({page: 1, ordering: "name"});
    const {data: AllSubcategories} = useGetPnlSubCategoriesQuery({page: 1, ordering: "name"});
    const {data: PaymentMethods} = useGetPnlPaymentMethodsQuery({page: 1, ordering: "name"});
    const {data: AllCurrencies} = useGetPnlCurrenciesQuery({page: 1, ordering: "name"});
    const { data: schoolsRes, isFetching: isSchoolsLoading } = useGetSchoolsQuery({page: 1});

    const schools = schoolsRes?.results ?? [];
    const [selectedSchool, setSelectedSchool] = useState<string>("all");

    const schoolFilter =
        selectedSchool === "all" || selectedSchool === ""
            ? undefined
            : Number(selectedSchool);

    const {
        data: AllTransactions,
        isLoading: TransactionsLoading,
        error: TransactionsError,
    } = useGetPnlTransactionsQuery({
        page: currentPage,
        ordering: "-created_at",
        type: typeFilter,
        category: categoryFilter,
        currency: currencyFilter,
        payment_method: paymentMethodFilter,
        created_at_after,
        created_at_before,
        school: schoolFilter,
    });

    const [createTransaction, {isLoading: createTransactionLoading, error: createTransactionError}] =
        useCreatePnlTransactionMutation();

    const [updateTransaction, {isLoading: updateTransactionLoading, error: updateTransactionError}] =
        useUpdatePnlTransactionMutation();

    const [deleteTransaction, {isLoading: deleteTransactionLoading, error: deleteTransactionError}] =
        useDeletePnlTransactionMutation();

    const [getTransactionById, {data: transactionByIdData}] =
        useLazyGetPnlTransactionByIdQuery();

    type CreateArg = Parameters<typeof createTransaction>[0];
    type UpdateArg = Parameters<typeof updateTransaction>[0];
    type UpdateData = UpdateArg extends { data: infer D } ? D : never;

    const availableSubcategories = useMemo(() => {
        const catId = transactionData.category_id;
        if (!catId) return [];
        return (
            AllSubcategories?.results?.filter((s) => s.category?.id?.toString() === catId) || []
        );
    }, [AllSubcategories?.results, transactionData.category_id]);

    const availableEditSubcategories = useMemo(() => {
        const catId = editTransactionData.category_id;
        if (!catId) return [];
        return (
            AllSubcategories?.results?.filter((s) => s.category?.id?.toString() === catId) || []
        );
    }, [AllSubcategories?.results, editTransactionData.category_id]);

    const getPaymentIcon = (id: number) => {
        const icons = [
            <CreditCard className="h-4 w-4" key="creditcard"/>,
            <Wallet className="h-4 w-4" key="wallet"/>,
            <Banknote className="h-4 w-4" key="banknote"/>,
        ];
        return icons[id % icons.length];
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();

        const subcategoryValue =
            transactionData.subcategory_id === "none" || transactionData.subcategory_id === ""
                ? undefined
                : Number(transactionData.subcategory_id);

        const payload: CreateArg = {
            category_id: Number(transactionData.category_id),
            subcategory_id: subcategoryValue,
            payment_method_id: Number(transactionData.payment_method_id),
            school_id: Number(transactionData.school_id),
            currency_id: Number(transactionData.currency_id),
            amount: transactionData.amount,
            type: transactionData.type,
            description: transactionData.description,
        } as CreateArg;

        try {
            await createTransaction(payload).unwrap();
            setCreateDialogOpen(false);
            setTransactionData(DEFAULT_FORM);
            toast({title: "Успішно", description: "Транзакцію створено"});
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося створити транзакцію",
                variant: "destructive",
            });
        }
    };

    const handleEditTransaction = async (id: number) => {
        setSelectedTransactionId(id);

        try {
            const result = await getTransactionById({id}).unwrap();

            setEditTransactionData({
                category_id: result.category?.id?.toString() || "",
                subcategory_id: result.subcategory?.id ? result.subcategory.id.toString() : "none",
                payment_method_id: result.payment_method?.id?.toString() || "",
                currency_id: result.currency?.id?.toString() || "",
                school_id: result.school?.id?.toString() || "", // ✅
                amount: result.amount?.toString?.() ?? String(result.amount ?? ""),
                type: result.type,
                description: result.description || "",
            });

            setEditDialogOpen(true);
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося завантажити транзакцію",
                variant: "destructive",
            });
        }
    };

    const handleUpdateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();

        const subcategoryValue =
            editTransactionData.subcategory_id === "none" || editTransactionData.subcategory_id === ""
                ? null
                : Number(editTransactionData.subcategory_id);

        const data: UpdateData = {
            category_id: Number(editTransactionData.category_id),
            subcategory_id: subcategoryValue,
            payment_method_id: Number(editTransactionData.payment_method_id),
            school_id: Number(editTransactionData.school_id),
            currency_id: Number(editTransactionData.currency_id),
            amount: editTransactionData.amount,
            type: editTransactionData.type,
            description: editTransactionData.description,
        } as UpdateData;

        try {
            await updateTransaction({id: selectedTransactionId, data} as UpdateArg).unwrap();
            setEditDialogOpen(false);
            setSelectedTransactionId(0);
            setEditTransactionData(DEFAULT_FORM);
            toast({title: "Успішно", description: "Транзакцію оновлено"});
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося оновити транзакцію",
                variant: "destructive",
            });
        }
    };

    const handleOpenDeleteDialog = async (id: number) => {
        setSelectedTransactionId(id);
        try {
            await getTransactionById({id}).unwrap();
            setDeleteDialogOpen(true);
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося завантажити транзакцію",
                variant: "destructive",
            });
        }
    };

    const handleDeleteTransaction = async () => {
        try {
            await deleteTransaction({id: selectedTransactionId}).unwrap();
            setDeleteDialogOpen(false);
            setSelectedTransactionId(0);
            toast({title: "Успішно", description: "Транзакцію видалено"});
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося видалити транзакцію",
                variant: "destructive",
            });
        }
    };

    const listHeader = (
        <Card className="grid grid-cols-2 xl:grid-cols-8 gap-2 font-semibold border p-3 rounded-lg text-sm text-muted-foreground">
            <span>Категорія</span>

            <span className="hidden xl:block">Підкатегорія</span>
            <span className="hidden xl:block">Школа</span>
            <span className="hidden xl:block">Метод оплати</span>
            <span className="hidden xl:block">Валюта</span>
            <span className="hidden xl:block">Дата</span>
            <span className="hidden xl:block text-center">Сума</span>
            <span className="text-right xl:text-center">Дії</span>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Доходи та витрати</h1>
                <p className="text-base md:text-lg text-muted-foreground">
                    Управління доходами та витратами транзакцій
                </p>
            </div>

            <Card>
                <CardHeader className="flex flex-col md:flex-row gap-3 md:gap-0 justify-between">
                    <CardTitle className="text-lg">Транзакції</CardTitle>

                    <Button onClick={() => setCreateDialogOpen(true)} className="cursor-pointer w-full md:w-auto">
                        <Plus className="h-4 w-4"/>
                        Додати транзакцію
                    </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1 flex flex-col">
                            <Label htmlFor="date-range" className="text-sm">
                                <Calendar className="inline h-3 w-3 mr-1"/>
                                Період дат
                            </Label>

                            <DatePicker
                                id="date-range"
                                selectsRange
                                startDate={startDate}
                                endDate={endDate}
                                onChange={(dates: [Date | null, Date | null] | null) => {
                                    const [start, end] = dates ?? [null, null];
                                    setStartDate(start);
                                    setEndDate(end);
                                    setCurrentPage(1);
                                }}
                                isClearable
                                placeholderText="Оберіть період"
                                className="w-full p-2 border rounded-md cursor-pointer text-muted-foreground text-sm"
                                dateFormat="dd.MM.yyyy"
                                popperClassName="z-50"
                            />
                        </div>

                        <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                            <Label className="text-sm">
                                <Filter className="inline h-3 w-3 mr-1" />
                                Школа
                            </Label>

                            <Select
                                value={selectedSchool}
                                onValueChange={(v) => {
                                    setSelectedSchool(v);
                                    setCurrentPage(1);
                                }}
                                disabled={isSchoolsLoading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Всі школи" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Всі школи</SelectItem>
                                    {schools.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.name || "Немає"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm">
                                <Filter className="inline h-3 w-3 mr-1"/>
                                Тип
                            </Label>
                            <Select
                                value={selectedType}
                                onValueChange={(v) => {
                                    setSelectedType(v);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Всі"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Всі</SelectItem>
                                    <SelectItem value={TransactionTypeEnum.income}>Доходи</SelectItem>
                                    <SelectItem value={TransactionTypeEnum.expense}>Витрати</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm">
                                <Filter className="inline h-3 w-3 mr-1"/>
                                Категорія
                            </Label>
                            <Select
                                value={selectedCategory}
                                onValueChange={(v) => {
                                    setSelectedCategory(v);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Всі категорії"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Всі категорії</SelectItem>
                                    {AllCategories?.results?.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name || "Немає"}
                                        </SelectItem>
                                    )) || null}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm">
                                <Filter className="inline h-3 w-3 mr-1"/>
                                Валюта
                            </Label>
                            <Select
                                value={selectedCurrency}
                                onValueChange={(v) => {
                                    setSelectedCurrency(v);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Всі валюти"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Всі валюти</SelectItem>
                                    {AllCurrencies?.results?.map((cur) => (
                                        <SelectItem key={cur.id} value={cur.id.toString()}>
                                            {cur.name || "Немає"} ({cur.code || "Немає"}) {cur.symbol || ""}
                                        </SelectItem>
                                    )) || null}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                            <Label className="text-sm">
                                <Filter className="inline h-3 w-3 mr-1"/>
                                Спосіб оплати
                            </Label>
                            <Select
                                value={selectedPaymentMethod}
                                onValueChange={(v) => {
                                    setSelectedPaymentMethod(v);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Всі способи"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Всі способи</SelectItem>
                                    {PaymentMethods?.results?.map((m) => (
                                        <SelectItem key={m.id} value={m.id.toString()}>
                                            {m.name || "Немає"}
                                        </SelectItem>
                                    )) || null}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {TransactionsError ? (
                <div className="text-center py-8 text-destructive">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2"/>
                    Помилка завантаження транзакцій
                </div>
            ) : !TransactionsLoading && (!AllTransactions?.results || AllTransactions.results.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2"/>
                    Транзакцій немає
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <div className="min-w-[1000px]">
                        <ResponsiveList
                            data={AllTransactions}
                            isLoading={TransactionsLoading}
                            page={currentPage}
                            pageSize={10}
                            onPageChange={setCurrentPage}
                            getId={(t) => t.id}
                            header={listHeader}
                            renderRow={(t, open, onToggle) => (
                                <Card
                                    onClick={onToggle}
                                    className="grid grid-cols-2 xl:grid-cols-8 gap-2 p-3 items-center cursor-pointer"
                                >
                                    <div className="flex flex-col gap-2 min-w-0">
                                        <div className="flex items-center gap-1 min-w-0">
                                            {t.type === TransactionTypeEnum.income ? (
                                                <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                                            )}
                                            <p className="font-medium truncate">{t.category?.name || "Немає"}</p>
                                        </div>

                                        <Badge variant="outline" className="max-w-[90px] text-xs shrink-0">
                                            {STATUS_LABELS[t.type]}
                                        </Badge>
                                    </div>

                                    <div className="hidden xl:block truncate">
                                        {t.subcategory?.name || "Немає"}
                                    </div>

                                    <div className="hidden xl:block truncate">
                                        {t.school?.name || "Немає"}
                                    </div>

                                    <div className="hidden xl:flex items-center gap-1 truncate">
                                        {t.payment_method?.id ? getPaymentIcon(t.payment_method.id) : null}
                                        {t.payment_method?.name || "Немає"}
                                    </div>

                                    <div className="hidden xl:block truncate">
                                        {t.currency?.code ? (
                                            <span>{t.currency.code} {t.currency.symbol || ""}</span>
                                        ) : (
                                            "Немає"
                                        )}
                                    </div>

                                    <div className="hidden xl:block">
                                        {t.created_at ? new Date(t.created_at).toLocaleDateString("uk-UA") : "Немає"}
                                    </div>

                                    <div
                                        className={`hidden xl:block text-base font-bold text-center ${
                                            t.type === TransactionTypeEnum.income ? "text-green-600" : "text-red-600"
                                        }`}
                                    >
                                        {t.type === TransactionTypeEnum.income ? "+" : "-"}
                                        {t.currency?.symbol || "₴"}
                                        {Number(t.amount).toLocaleString("uk-UA")}
                                    </div>

                                    <div className="flex justify-end xl:justify-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditTransaction(t.id);
                                            }}
                                            className="h-8 w-8 cursor-pointer"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenDeleteDialog(t.id);
                                            }}
                                            className="h-8 w-8 text-destructive cursor-pointer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            )}
                            renderMobileDetails={(t) => (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-muted-foreground">Дата</span>
                                        <span>{t.created_at ? new Date(t.created_at).toLocaleDateString("uk-UA") : "Немає"}</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-muted-foreground">Підкатегорія</span>
                                        <span className="text-right">{t.subcategory?.name || "Немає"}</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-muted-foreground">Школа</span>
                                        <span className="text-right">{t.school?.name || "Немає"}</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-muted-foreground">Метод оплати</span>
                                        <span
                                            className="flex items-center gap-2">{t.payment_method?.id ? getPaymentIcon(t.payment_method.id) : null}{t.payment_method?.name || "Немає"}</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-muted-foreground">Валюта</span>
                                        <span>{t.currency?.code ? `${t.currency.code} ${t.currency.symbol || ""}` : "Немає"}</span>
                                    </div>

                                    {t.description ? (
                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground">Опис</div>
                                            <div>{t.description}</div>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        />
                    </div>
                </div>
            )}

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Додати транзакцію</DialogTitle>
                        <DialogDescription>Швидке додавання доходу або витрати</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddTransaction} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Тип *</Label>
                            <Select
                                value={transactionData.type}
                                onValueChange={(value: TransactionTypeEnum) =>
                                    setTransactionData((prev) => ({
                                        ...prev,
                                        type: value,
                                        category_id: "",
                                        subcategory_id: "",
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TransactionTypeEnum.income}>Дохід</SelectItem>
                                    <SelectItem value={TransactionTypeEnum.expense}>Витрата</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Сума *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={transactionData.amount}
                                onChange={(e) => setTransactionData((prev) => ({...prev, amount: e.target.value}))}
                                placeholder="1000.00"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Категорія *</Label>
                            <Select
                                value={transactionData.category_id}
                                onValueChange={(value) =>
                                    setTransactionData((prev) => ({
                                        ...prev,
                                        category_id: value,
                                        subcategory_id: "",
                                    }))
                                }
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Оберіть категорію"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {AllCategories?.results?.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name || "Немає"}
                                        </SelectItem>
                                    )) || null}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Школа *</Label>
                            <Select
                                value={transactionData.school_id}
                                onValueChange={(value) =>
                                    setTransactionData((prev) => ({
                                        ...prev,
                                        school_id: value,
                                    }))
                                }
                                required
                                disabled={isSchoolsLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Оберіть школу" />
                                </SelectTrigger>
                                <SelectContent>
                                    {schools.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.name || "Немає"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {availableSubcategories.length > 0 && (
                            <div className="space-y-2">
                                <Label>Підкатегорія</Label>
                                <Select
                                    value={transactionData.subcategory_id || "none"}
                                    onValueChange={(value) => setTransactionData((prev) => ({
                                        ...prev,
                                        subcategory_id: value
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Оберіть підкатегорію"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Без підкатегорії</SelectItem>
                                        {availableSubcategories.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name || "Немає"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Спосіб оплати *</Label>
                            <Select
                                value={transactionData.payment_method_id}
                                onValueChange={(value) => setTransactionData((prev) => ({
                                    ...prev,
                                    payment_method_id: value
                                }))}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Оберіть спосіб оплати"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {PaymentMethods?.results?.map((m) => (
                                        <SelectItem key={m.id} value={m.id.toString()}>
                                            {m.name || "Немає"}
                                        </SelectItem>
                                    )) || null}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Валюта *</Label>
                            <Select
                                value={transactionData.currency_id}
                                onValueChange={(value) => setTransactionData((prev) => ({...prev, currency_id: value}))}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Оберіть валюту"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {AllCurrencies?.results?.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.name || "Немає"} ({c.code || "Немає"}) {c.symbol || ""}
                                        </SelectItem>
                                    )) || null}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Опис</Label>
                            <Textarea
                                value={transactionData.description}
                                onChange={(e) => setTransactionData((prev) => ({...prev, description: e.target.value}))}
                                placeholder="Наприклад: Оплата оренди / Реклама / Зарплата"
                            />
                        </div>

                        {createTransactionError ? (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                Сталася помилка під час створення транзакції
                            </div>
                        ) : null}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}
                                    className="cursor-pointer">
                                Скасувати
                            </Button>
                            <Button type="submit" disabled={createTransactionLoading} className="cursor-pointer">
                                {createTransactionLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
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
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Редагувати транзакцію</DialogTitle>
                        <DialogDescription>Внесіть зміни до транзакції</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdateTransaction} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Тип *</Label>
                            <Select
                                value={editTransactionData.type}
                                onValueChange={(value: TransactionTypeEnum) =>
                                    setEditTransactionData((prev) => ({
                                        ...prev,
                                        type: value,
                                        category_id: "",
                                        subcategory_id: "none",
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TransactionTypeEnum.income}>Дохід</SelectItem>
                                    <SelectItem value={TransactionTypeEnum.expense}>Витрата</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Сума *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editTransactionData.amount}
                                onChange={(e) => setEditTransactionData((prev) => ({...prev, amount: e.target.value}))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Школа *</Label>
                            <Select
                                value={editTransactionData.school_id}
                                onValueChange={(value) =>
                                    setEditTransactionData((prev) => ({
                                        ...prev,
                                        school_id: value,
                                    }))
                                }
                                required
                                disabled={isSchoolsLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Оберіть школу" />
                                </SelectTrigger>
                                <SelectContent>
                                    {schools.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.name || "Немає"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Категорія *</Label>
                            <Select
                                value={editTransactionData.category_id}
                                onValueChange={(value) =>
                                    setEditTransactionData((prev) => ({
                                        ...prev,
                                        category_id: value,
                                        subcategory_id: "none",
                                    }))
                                }
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Оберіть категорію"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {AllCategories?.results?.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name || "Немає"}
                                        </SelectItem>
                                    )) || null}
                                </SelectContent>
                            </Select>
                        </div>

                        {availableEditSubcategories.length > 0 && (
                            <div className="space-y-2">
                                <Label>Підкатегорія</Label>
                                <Select
                                    value={editTransactionData.subcategory_id || "none"}
                                    onValueChange={(value) => setEditTransactionData((prev) => ({
                                        ...prev,
                                        subcategory_id: value
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Оберіть підкатегорію"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Без підкатегорії</SelectItem>
                                        {availableEditSubcategories.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name || "Немає"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Спосіб оплати *</Label>
                            <Select
                                value={editTransactionData.payment_method_id}
                                onValueChange={(value) => setEditTransactionData((prev) => ({
                                    ...prev,
                                    payment_method_id: value
                                }))}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Оберіть спосіб оплати"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {PaymentMethods?.results?.map((m) => (
                                        <SelectItem key={m.id} value={m.id.toString()}>
                                            {m.name || "Немає"}
                                        </SelectItem>
                                    )) || null}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Валюта *</Label>
                            <Select
                                value={editTransactionData.currency_id}
                                onValueChange={(value) => setEditTransactionData((prev) => ({
                                    ...prev,
                                    currency_id: value
                                }))}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Оберіть валюту"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {AllCurrencies?.results?.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.name || "Немає"} ({c.code || "Немає"}) {c.symbol || ""}
                                        </SelectItem>
                                    )) || null}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Опис</Label>
                            <Textarea
                                value={editTransactionData.description}
                                onChange={(e) => setEditTransactionData((prev) => ({
                                    ...prev,
                                    description: e.target.value
                                }))}
                            />
                        </div>

                        {updateTransactionError ? (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                Сталася помилка під час оновлення транзакції
                            </div>
                        ) : null}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}
                                    className="cursor-pointer">
                                Скасувати
                            </Button>
                            <Button type="submit" disabled={updateTransactionLoading} className="cursor-pointer">
                                {updateTransactionLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
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
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Видалити транзакцію?</DialogTitle>
                        <DialogDescription>
                            Ця дія незворотна. Транзакція буде видалена назавжди.
                        </DialogDescription>
                    </DialogHeader>

                    {transactionByIdData ? (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                            <div className="font-bold text-lg mb-2">
                                {transactionByIdData.category?.name || "Немає"} {" - "}
                                {transactionByIdData.payment_method?.name || "Немає"}
                            </div>

                            <div className="text-sm text-muted-foreground">
                                Сума:{" "}
                                {transactionByIdData.type === TransactionTypeEnum.income ? "+" : "-"}
                                {transactionByIdData.currency?.symbol || "₴"}
                                {Number(transactionByIdData.amount).toLocaleString("uk-UA")}
                            </div>

                            <div className="text-sm text-muted-foreground">
                                Дата:{" "}
                                {transactionByIdData.created_at
                                    ? new Date(transactionByIdData.created_at).toLocaleDateString("uk-UA")
                                    : "Немає"}
                            </div>

                            {transactionByIdData.description ? (
                                <div className="text-sm text-muted-foreground mt-2">
                                    Опис: {transactionByIdData.description}
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-20">
                            <Loader2 className="h-6 w-6 animate-spin"/>
                        </div>
                    )}

                    {deleteTransactionError ? (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                            Сталася помилка під час видалення транзакції
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button variant="outline" className="cursor-pointer" onClick={() => setDeleteDialogOpen(false)}>
                            Скасувати
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteTransaction}
                            disabled={deleteTransactionLoading}
                            className="cursor-pointer"
                        >
                            {deleteTransactionLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                    Видалення...
                                </>
                            ) : (
                                "Видалити"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PnlCurrency/>
            <PnlCategory />
            <PnlSubcategory />
            <PnlPaymentMethod />
        </div>
    );
}