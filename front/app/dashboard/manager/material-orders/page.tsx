"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    CalendarDays,
    ClipboardList,
    Coins,
    Loader2,
    Plus,
    ReceiptText,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


import {
    useGetBooksQuery,
    useCreateBookMutation,
} from "@/store/book/book.api";
import {
    useGetBookTransactionsQuery,
    useCreateBookTransactionMutation,
    useDeleteBookTransactionMutation,
} from "@/store/book/book-transaction.api";
import { useGetBookDashboardMutation } from "@/store/book/book-dashboard.api";
import { BookTransactionTypeEnum, type BookTransaction } from "@/store/book/book-transaction.type";

import {
    useGetPnlCategoriesQuery,
    useGetPnlSubCategoriesQuery,
    useGetPnlPaymentMethodsQuery,
    useGetPnlCurrenciesQuery,
    useGetPnlTransactionsQuery,
    useCreatePnlTransactionMutation,
    useDeletePnlTransactionMutation,
} from "@/store/pnl/pnl.api";
import { TransactionTypeEnum, type Transaction } from "@/store/pnl/pnl.type";

import {ResponsiveList} from "@/components/ui/ResponsiveList";
import ActionsDropdown from "@/components/ui/actions-dropdown";
import {useGetProfileMeQuery} from "@/store/users/user.api";
import { Row } from "@/components/manager/groups/ui/Row";

export default function MaterialOrdersPage() {
    const [bookPage, setBookPage] = useState(1);
    const [translationPage, setTranslationPage] = useState(1);

    const [bookDialogOpen, setBookDialogOpen] = useState(false);
    const [bookOrderDialogOpen, setBookOrderDialogOpen] = useState(false);
    const [translationDialogOpen, setTranslationDialogOpen] = useState(false);

    const [bookName, setBookName] = useState("");
    const [bookDescription, setBookDescription] = useState("");
    const [bookAmount, setBookAmount] = useState("0");
    const [bookPrice, setBookPrice] = useState("");
    const [bookCurrencyId, setBookCurrencyId] = useState("");

    const [orderBookId, setOrderBookId] = useState("");
    const [orderPaymentMethodId, setOrderPaymentMethodId] = useState("");
    const [orderType, setOrderType] = useState<BookTransactionTypeEnum>(
        BookTransactionTypeEnum.buy
    );
    const [orderAmount, setOrderAmount] = useState("1");

    const [translationSubcategoryId, setTranslationSubcategoryId] = useState("");
    const [translationPaymentMethodId, setTranslationPaymentMethodId] =
        useState("");
    const [translationCurrencyId, setTranslationCurrencyId] = useState("");
    const [translationSchoolId, setTranslationSchoolId] = useState("");
    const [translationAmount, setTranslationAmount] = useState("");
    const [translationDescription, setTranslationDescription] = useState("");

    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
        )}-01`;
    });

    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
        )}-${String(date.getDate()).padStart(2, "0")}`;
    });

    const { data: profile } = useGetProfileMeQuery();

    const { data: books, isLoading: isBooksLoading } = useGetBooksQuery({
        page: 1,
        ordering: "name",
    });

    const { data: currencies, isLoading: isCurrenciesLoading } =
        useGetPnlCurrenciesQuery({
            page: 1,
            page_size: 10,
            ordering: "code",
        });

    const { data: paymentMethods, isLoading: isPaymentMethodsLoading } =
        useGetPnlPaymentMethodsQuery({
            page: 1,
            ordering: "name",
        });

    const { data: translationCategories, isLoading: isTranslationCategoriesLoading } =
        useGetPnlCategoriesQuery({
            page: 1,
            name: "Переклади",
            ordering: "name",
        });

    const translationCategoryId = translationCategories?.results?.[0]?.id;

    const { data: translationSubcategories } = useGetPnlSubCategoriesQuery(
        {
            page: 1,
            category: translationCategoryId,
            ordering: "name",
        },
        {
            skip: !translationCategoryId,
        }
    );

    const {
        data: bookTransactions,
        isLoading: isBookTransactionsLoading,
    } = useGetBookTransactionsQuery({
        page: bookPage,
        ordering: "-created_at",
    });

    const {
        data: translationTransactions,
        isLoading: isTranslationTransactionsLoading,
    } = useGetPnlTransactionsQuery(
        {
            page: translationPage,
            page_size: 50,
            type: TransactionTypeEnum.expense,
            category: translationCategoryId,
            ordering: "-created_at",
        },
        {
            skip: !translationCategoryId,
        }
    );

    const [createBook, { isLoading: isCreatingBook }] = useCreateBookMutation();
    const [createBookTransaction, { isLoading: isCreatingBookTransaction }] =
        useCreateBookTransactionMutation();
    const [deleteBookTransaction] = useDeleteBookTransactionMutation();

    const [createPnlTransaction, { isLoading: isCreatingTranslation }] =
        useCreatePnlTransactionMutation();
    const [deletePnlTransaction] = useDeletePnlTransactionMutation();

    const [
        getBookDashboard,
        { data: bookDashboard, isLoading: isBookDashboardLoading },
    ] = useGetBookDashboardMutation();

    const profileSchools = useMemo(() => {
        return profile?.schools ?? [];
    }, [profile]);

    useEffect(() => {
        getBookDashboard({
            start_date: startDate,
            end_date: endDate,
        });
    }, [getBookDashboard, startDate, endDate]);

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Книги і переклади
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Замовлення книг, витрати на переклади та контроль матеріалів для
                        курсів.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Додати книгу
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Нова книга</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Назва</Label>
                                    <Input
                                        value={bookName}
                                        onChange={(e) => setBookName(e.target.value)}
                                        placeholder="Наприклад: English File A1"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Опис</Label>
                                    <Textarea
                                        value={bookDescription}
                                        onChange={(e) => setBookDescription(e.target.value)}
                                        placeholder="Короткий опис книги"
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Кількість</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={bookAmount}
                                            onChange={(e) => setBookAmount(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Ціна</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={bookPrice}
                                            onChange={(e) => setBookPrice(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Валюта</Label>
                                        <Select
                                            value={bookCurrencyId}
                                            onValueChange={setBookCurrencyId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Оберіть" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currencies?.results?.map((currency) => (
                                                    <SelectItem key={currency.id} value={String(currency.id)}>
                                                        {currency.code} · {currency.symbol}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    disabled={
                                        isCreatingBook ||
                                        !bookName.trim() ||
                                        !bookCurrencyId ||
                                        !bookPrice
                                    }
                                    onClick={async () => {
                                        await createBook({
                                            name: bookName,
                                            description: bookDescription,
                                            amount: Number(bookAmount || 0),
                                            price: Number(bookPrice || 0),
                                            currency_id: Number(bookCurrencyId),
                                        }).unwrap();

                                        setBookName("");
                                        setBookDescription("");
                                        setBookAmount("0");
                                        setBookPrice("");
                                        setBookCurrencyId("");
                                        setBookDialogOpen(false);
                                    }}
                                >
                                    {isCreatingBook ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Створити книгу
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={bookOrderDialogOpen}
                        onOpenChange={setBookOrderDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Замовити книгу
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Нове замовлення книги</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Книга</Label>
                                    <Select value={orderBookId} onValueChange={setOrderBookId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Оберіть книгу" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {books?.results?.map((book) => (
                                                <SelectItem key={book.id} value={String(book.id)}>
                                                    {book.name} · {book.currency?.code ?? "Немає"}{" "}
                                                    {book.price}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Тип</Label>
                                        <Select
                                            value={orderType}
                                            onValueChange={(value) =>
                                                setOrderType(value as BookTransactionTypeEnum)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={BookTransactionTypeEnum.buy}>
                                                    Купівля
                                                </SelectItem>
                                                <SelectItem value={BookTransactionTypeEnum.sell}>
                                                    Видача / продаж
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Кількість</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={orderAmount}
                                            onChange={(e) => setOrderAmount(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Оплата</Label>
                                        <Select
                                            value={orderPaymentMethodId}
                                            onValueChange={setOrderPaymentMethodId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Оберіть" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {paymentMethods?.results?.map((method) => (
                                                    <SelectItem key={method.id} value={String(method.id)}>
                                                        {method.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    disabled={
                                        isCreatingBookTransaction ||
                                        !orderBookId ||
                                        !orderPaymentMethodId ||
                                        !orderAmount
                                    }
                                    onClick={async () => {
                                        await createBookTransaction({
                                            book_id: Number(orderBookId),
                                            payment_method_id: Number(orderPaymentMethodId),
                                            type: orderType,
                                            amount: Number(orderAmount),
                                        }).unwrap();

                                        setOrderBookId("");
                                        setOrderPaymentMethodId("");
                                        setOrderType(BookTransactionTypeEnum.buy);
                                        setOrderAmount("1");
                                        setBookOrderDialogOpen(false);
                                    }}
                                >
                                    {isCreatingBookTransaction ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Створити замовлення
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={translationDialogOpen}
                        onOpenChange={setTranslationDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Додати переклад
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Нова витрата на переклад</DialogTitle>
                            </DialogHeader>

                            {!translationCategoryId ? (
                                <Card className="border-destructive/40">
                                    <CardContent className="p-4 text-sm text-destructive">
                                        Категорію “Переклади” не знайдено в PNL. Спочатку створіть
                                        категорію “Переклади”.
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Підкатегорія</Label>
                                            <Select
                                                value={translationSubcategoryId}
                                                onValueChange={setTranslationSubcategoryId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Оберіть" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {translationSubcategories?.results?.map((subcategory) => (
                                                        <SelectItem
                                                            key={subcategory.id}
                                                            value={String(subcategory.id)}
                                                        >
                                                            {subcategory.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Школа</Label>
                                            <Select
                                                value={translationSchoolId}
                                                onValueChange={setTranslationSchoolId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Оберіть" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {profileSchools.map((school) => (
                                                        <SelectItem key={school.id} value={String(school.id)}>
                                                            {school.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Оплата</Label>
                                            <Select
                                                value={translationPaymentMethodId}
                                                onValueChange={setTranslationPaymentMethodId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Оберіть" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {paymentMethods?.results?.map((method) => (
                                                        <SelectItem key={method.id} value={String(method.id)}>
                                                            {method.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Валюта</Label>
                                            <Select
                                                value={translationCurrencyId}
                                                onValueChange={setTranslationCurrencyId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Оберіть" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {currencies?.results?.map((currency) => (
                                                        <SelectItem key={currency.id} value={String(currency.id)}>
                                                            {currency.code} · {currency.symbol}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Сума</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={translationAmount}
                                            onChange={(e) => setTranslationAmount(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Опис</Label>
                                        <Textarea
                                            value={translationDescription}
                                            onChange={(e) => setTranslationDescription(e.target.value)}
                                            placeholder="Наприклад: Переклад матеріалів для курсу A2"
                                        />
                                    </div>

                                    <Button
                                        className="w-full"
                                        disabled={
                                            isCreatingTranslation ||
                                            !translationCategoryId ||
                                            !translationPaymentMethodId ||
                                            !translationCurrencyId ||
                                            !translationSchoolId ||
                                            !translationAmount
                                        }
                                        onClick={async () => {
                                            await createPnlTransaction({
                                                category_id: translationCategoryId,
                                                subcategory_id: translationSubcategoryId
                                                    ? Number(translationSubcategoryId)
                                                    : null,
                                                payment_method_id: Number(translationPaymentMethodId),
                                                currency_id: Number(translationCurrencyId),
                                                school_id: Number(translationSchoolId),
                                                amount: translationAmount,
                                                type: TransactionTypeEnum.expense,
                                                description: translationDescription,
                                            }).unwrap();

                                            setTranslationSubcategoryId("");
                                            setTranslationPaymentMethodId("");
                                            setTranslationCurrencyId("");
                                            setTranslationSchoolId("");
                                            setTranslationAmount("");
                                            setTranslationDescription("");
                                            setTranslationDialogOpen(false);
                                        }}
                                    >
                                        {isCreatingTranslation ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        Зберегти переклад
                                    </Button>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="rounded-xl bg-muted p-3">
                            <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Період</p>
                            <p className="font-medium">
                                {bookDashboard?.period
                                    ? `${bookDashboard.period.start} · ${bookDashboard.period.end}`
                                    : "Немає"}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="rounded-xl bg-muted p-3">
                            <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Замовлень книг</p>
                            <p className="font-medium">
                                {Object.values(bookDashboard?.summary ?? {}).reduce(
                                    (sum, item) => sum + item.orders_count,
                                    0
                                )}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="rounded-xl bg-muted p-3">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Кількість книг</p>
                            <p className="font-medium">
                                {Object.values(bookDashboard?.summary ?? {}).reduce(
                                    (sum, item) => sum + item.total_books_amount,
                                    0
                                )}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="rounded-xl bg-muted p-3">
                            <ReceiptText className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Перекладів</p>
                            <p className="font-medium">
                                {translationTransactions?.count ?? 0}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="books" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 md:w-fit">
                    <TabsTrigger value="books">Книги</TabsTrigger>
                    <TabsTrigger value="translations">Переклади</TabsTrigger>
                    <TabsTrigger value="analytics">Аналітика</TabsTrigger>
                </TabsList>

                <TabsContent value="books" className="space-y-4">
                    <ResponsiveList
                        data={bookTransactions}
                        isLoading={isBookTransactionsLoading || isBooksLoading}
                        page={bookPage}
                        pageSize={50}
                        onPageChange={setBookPage}
                        getId={(item: BookTransaction) => item.id}
                        header={
                            <Card className="px-4 py-3 grid grid-cols-2 xl:grid-cols-6 text-sm text-muted-foreground">
                                <div>Книга</div>
                                <div className="hidden xl:block">Тип</div>
                                <div className="hidden xl:block">Кількість</div>
                                <div className="hidden xl:block">Сума</div>
                                <div className="hidden xl:block">Дата</div>
                                <div className="text-right xl:text-center">Дії</div>
                            </Card>
                        }
                        renderRow={(item, open, onToggle) => (
                            <Card
                                onClick={onToggle}
                                className="px-4 py-3 grid grid-cols-2 xl:grid-cols-6 items-center cursor-pointer"
                            >
                                <div className="font-medium break-all">
                                    {item.book?.name || "Немає"}
                                </div>

                                <div className="hidden xl:flex break-all">
                                    {item.type === BookTransactionTypeEnum.buy
                                        ? "Купівля"
                                        : "Видача / продаж"}
                                </div>

                                <div className="hidden xl:flex break-all">
                                    {item.amount ? String(item.amount) : "Немає"}
                                </div>

                                <div className="hidden xl:flex break-all">
                                    {item.price || "Немає"} {item.currency?.code || "Немає"}
                                </div>

                                <div className="hidden xl:flex break-all">
                                    {item.created_at
                                        ? new Date(item.created_at).toLocaleDateString("uk-UA")
                                        : "Немає"}
                                </div>

                                <div
                                    className="flex justify-end xl:justify-center"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ActionsDropdown
                                        items={[
                                            {
                                                key: "delete",
                                                label: "",
                                                content: (
                                                    <div
                                                        className="flex cursor-pointer items-center px-2 py-1.5 text-sm text-destructive outline-none"
                                                        onClick={async () => {
                                                            await deleteBookTransaction(item.id).unwrap();
                                                        }}
                                                    >
                                                        Видалити
                                                    </div>
                                                ),
                                            },
                                        ]}
                                    />
                                </div>
                            </Card>
                        )}
                        renderMobileDetails={(item) => (
                            <div className="space-y-3">
                                <Row
                                    label="Тип"
                                    value={
                                        item.type === BookTransactionTypeEnum.buy
                                            ? "Купівля"
                                            : "Видача / продаж"
                                    }
                                />
                                <Row
                                    label="Кількість"
                                    value={item.amount ? String(item.amount) : "Немає"}
                                />
                                <Row
                                    label="Сума"
                                    value={`${item.price || "Немає"} ${item.currency?.code || "Немає"}`}
                                />
                                <Row
                                    label="Оплата"
                                    value={item.payment_method?.name || "Немає"}
                                />
                                <Row
                                    label="Створив"
                                    value={item.created_by?.full_name || "Немає"}
                                />
                                <Row
                                    label="Дата"
                                    value={
                                        item.created_at
                                            ? new Date(item.created_at).toLocaleDateString("uk-UA")
                                            : "Немає"
                                    }
                                />
                                <Row
                                    label="Фінансова операція"
                                    value={item.finance_transaction ? String(item.finance_transaction) : "Немає"}
                                />
                            </div>
                        )}
                    />
                </TabsContent>

                <TabsContent value="translations" className="space-y-4">
                    {!translationCategoryId && !isTranslationCategoriesLoading ? (
                        <Card className="border-destructive/40">
                            <CardContent className="p-4 text-sm text-destructive">
                                Категорію “Переклади” не знайдено. Для історії перекладів треба
                                створити категорію “Переклади” у PNL.
                            </CardContent>
                        </Card>
                    ) : null}

                    <ResponsiveList
                        data={translationTransactions}
                        isLoading={
                            isTranslationTransactionsLoading ||
                            isPaymentMethodsLoading ||
                            isCurrenciesLoading
                        }
                        page={translationPage}
                        pageSize={50}
                        onPageChange={setTranslationPage}
                        getId={(item: Transaction) => item.id}
                        header={
                            <Card className="px-4 py-3 grid grid-cols-2 xl:grid-cols-6 text-sm text-muted-foreground">
                                <div>Опис</div>
                                <div className="hidden xl:block">Категорія</div>
                                <div className="hidden xl:block">Підкатегорія</div>
                                <div className="hidden xl:block">Сума</div>
                                <div className="hidden xl:block">Дата</div>
                                <div className="text-right xl:text-center">Дії</div>
                            </Card>
                        }
                        renderRow={(item, open, onToggle) => (
                            <Card
                                onClick={onToggle}
                                className="px-4 py-3 grid grid-cols-2 xl:grid-cols-6 items-center cursor-pointer"
                            >
                                <div className="font-medium break-all">
                                    {item.description || "Немає"}
                                </div>

                                <div className="hidden xl:flex break-all">
                                    {item.category?.name || "Немає"}
                                </div>

                                <div className="hidden xl:flex break-all">
                                    {item.subcategory?.name || "Немає"}
                                </div>

                                <div className="hidden xl:flex break-all">
                                    {item.amount || "Немає"} {item.currency?.code || "Немає"}
                                </div>

                                <div className="hidden xl:flex break-all">
                                    {item.created_at
                                        ? new Date(item.created_at).toLocaleDateString("uk-UA")
                                        : "Немає"}
                                </div>

                                <div
                                    className="flex justify-end xl:justify-center"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ActionsDropdown
                                        items={[
                                            {
                                                key: "delete",
                                                label: "",
                                                content: (
                                                    <div
                                                        className="flex cursor-pointer items-center px-2 py-1.5 text-sm text-destructive outline-none"
                                                        onClick={async () => {
                                                            await deletePnlTransaction({
                                                                id: item.id,
                                                            }).unwrap();
                                                        }}
                                                    >
                                                        Видалити
                                                    </div>
                                                ),
                                            },
                                        ]}
                                    />
                                </div>
                            </Card>
                        )}
                        renderMobileDetails={(item) => (
                            <div className="space-y-3">
                                <Row
                                    label="Категорія"
                                    value={item.category?.name || "Немає"}
                                />
                                <Row
                                    label="Підкатегорія"
                                    value={item.subcategory?.name || "Немає"}
                                />
                                <Row
                                    label="Сума"
                                    value={`${item.amount || "Немає"} ${item.currency?.code || "Немає"}`}
                                />
                                <Row
                                    label="Оплата"
                                    value={item.payment_method?.name || "Немає"}
                                />
                                <Row
                                    label="Школа"
                                    value={item.school?.name || "Немає"}
                                />
                                <Row
                                    label="Дата"
                                    value={
                                        item.created_at
                                            ? new Date(item.created_at).toLocaleDateString("uk-UA")
                                            : "Немає"
                                    }
                                />
                            </div>
                        )}
                    />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Період аналітики</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                            <div className="space-y-2">
                                <Label>Дата від</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Дата до</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>

                            <div className="flex items-end">
                                <Button
                                    className="w-full gap-2"
                                    disabled={isBookDashboardLoading}
                                    onClick={() => {
                                        getBookDashboard({
                                            start_date: startDate,
                                            end_date: endDate,
                                        });
                                    }}
                                >
                                    {isBookDashboardLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Coins className="h-4 w-4" />
                                    )}
                                    Оновити
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Object.entries(bookDashboard?.summary ?? {}).map(
                            ([currencyCode, item]) => (
                                <Card key={currencyCode}>
                                    <CardContent className="space-y-4 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    Валюта
                                                </p>
                                                <p className="text-xl font-semibold">{currencyCode}</p>
                                            </div>

                                            <div className="rounded-xl bg-muted p-3">
                                                <Coins className="h-5 w-5" />
                                            </div>
                                        </div>

                                        <div className="grid gap-3 text-sm">
                                            <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">
                          Замовлень
                        </span>
                                                <span className="font-medium">
                          {item.orders_count}
                        </span>
                                            </div>

                                            <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">
                          Книг куплено
                        </span>
                                                <span className="font-medium">
                          {item.total_books_amount}
                        </span>
                                            </div>

                                            <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">
                          Витрачено
                        </span>
                                                <span className="font-medium">
                          {item.total_spent} {currencyCode}
                        </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        )}

                        {!Object.keys(bookDashboard?.summary ?? {}).length ? (
                            <Card>
                                <CardContent className="p-4 text-sm text-muted-foreground">
                                    За вибраний період даних немає.
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
