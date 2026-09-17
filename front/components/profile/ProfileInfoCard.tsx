"use client";

import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import {
    CheckCircle2,
    KeyRound,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    School,
    UserRound,
    XCircle,
} from "lucide-react";
import {
    useGetProfileMeQuery,
    useUpdateProfileMeMutation,
} from "@/store/users/user.api";
import {
    useResetCheckCodeMutation,
    useResetPasswordMutation,
    useResetSendCodeMutation,
} from "@/store/public.api";
import { useToast } from "@/hooks/use-toast";
import { HeaderStep } from "@/components/reset-password/headerStep";
import { FormStep } from "@/components/reset-password/formStep";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { CITY_OPTIONS } from "@/components/landing/contact-form";
import MultiSchoolPicker from "@/components/profile/MultiSchoolPicker";
import { cn } from "@/libs/utils";

type Step = "send" | "code" | "password";

interface Props {
    showSchools?: boolean;
    className?: string;
}

export function ProfileInfoCard({ showSchools = true, className }: Props) {
    const { toast } = useToast();

    const {
        data: userData,
        isLoading: loadingUserData,
        error: errorUserData,
        refetch,
    } = useGetProfileMeQuery();

    const [
        updateProfile,
        { isLoading: loadingUpdateProfile, error: errorUpdate },
    ] = useUpdateProfileMeMutation();

    const [formData, setFormData] = useState({
        email: "",
        full_name: "",
        date_of_birth: "",
        phone_full: "+38099999999",
        phone_separated: "",
        city: "",
        school_ids: [] as number[],
    });

    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [step, setStep] = useState<Step>("send");

    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");

    const [sendCode, { isLoading: sending }] = useResetSendCodeMutation();
    const [checkCode, { isLoading: checking }] = useResetCheckCodeMutation();
    const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation();

    const stepDescriptions: Record<Step, string> = {
        send: "Введіть пошту для зміни паролю",
        code: "Введіть код з пошти",
        password: "Введіть новий пароль",
    };

    useEffect(() => {
        if (userData) {
            setFormData({
                email: userData.email || "",
                full_name: userData.full_name || "",
                date_of_birth: userData.date_of_birth || "",
                phone_full: userData.phone_normalized || "",
                phone_separated: userData.phone_normalized || "",
                city: (userData.city as string) || "",
                school_ids: Array.isArray(userData.schools)
                    ? userData.schools
                        .map((school: any) => {
                            if (typeof school === "number") return school;
                            if (school && typeof school.id === "number") return school.id;
                            return null;
                        })
                        .filter((school: unknown): school is number => typeof school === "number")
                    : [],
            });
        }
    }, [userData]);

    const handleSendCode = async () => {
        try {
            await sendCode({ email: formData.email }).unwrap();

            toast({
                title: "Код надіслано",
                description: "Перевірте пошту",
            });

            setStep("code");
        } catch {
            toast({
                title: "Помилка надсилання коду",
                variant: "destructive",
            });
        }
    };

    const handleCheckCode = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await checkCode({ email: formData.email, code }).unwrap();

            toast({
                title: "Код підтверджено",
                variant: "success",
            });

            setStep("password");
        } catch {
            toast({
                title: "Невірний код",
                variant: "destructive",
            });
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await resetPassword({
                email: formData.email,
                code,
                password,
                repeat_password: repeatPassword,
            }).unwrap();

            toast({
                title: "Пароль змінено",
                description: "Використовуйте новий пароль",
                variant: "success",
            });

            setPasswordModalOpen(false);
            setStep("send");
            setCode("");
            setPassword("");
            setRepeatPassword("");
        } catch {
            toast({
                title: "Помилка",
                description: "Не вдалося змінити пароль",
                variant: "destructive",
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const countryCodeMatch = formData.phone_separated.match(/^\+\d+/);
            const countryCode = countryCodeMatch ? countryCodeMatch[0] : "";
            const nationalNumber = formData.phone_separated
                .replace(countryCode, "")
                .replace(/\D/g, "");

            await updateProfile({
                email: formData.email,
                full_name: formData.full_name,
                phone_country_code: countryCode,
                phone_national_number: nationalNumber,
                date_of_birth: formData.date_of_birth,
                city: formData.city,
                ...(showSchools
                    ? {
                        school_ids: formData.school_ids
                            .map((school: any) => {
                                if (typeof school === "number") return school;
                                if (school && typeof school.id === "number") return school.id;
                                return null;
                            })
                            .filter((school: unknown): school is number => typeof school === "number"),
                    }
                    : {}),
            }).unwrap();

            toast({
                title: "Успішно!",
                description: "Профіль успішно оновлено",
                variant: "success",
            });

            refetch();
        } catch (error) {
            console.error("Помилка при оновленні профілю:", error);

            toast({
                title: "Помилка",
                description: "Не вдалося оновити профіль",
                variant: "destructive",
            });
        }
    };

    if (loadingUserData) {
        return (
            <Card className={cn("rounded-md p-6", className)}>
                <div className="flex h-48 items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                        Завантаження профілю...
                    </p>
                </div>
                </div>
            </Card>
        );
    }

    if (errorUserData) {
        return (
            <Card className={cn("rounded-md border-destructive/20 p-4", className)}>
                <div className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
                    <div className="min-w-0">
                <p className="font-semibold text-destructive">Помилка при завантаженні профілю</p>
                <p className="mt-1 text-sm">
                    Будь ласка, спробуйте оновити сторінку
                </p>

                <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => refetch()}
                >
                    Спробувати знову
                </Button>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <>
            <form onSubmit={handleSubmit} className={className}>
                <Card className="rounded-md">
                    <CardHeader className="border-b p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                    <UserRound className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                    <CardTitle className="truncate text-base">Особиста інформація</CardTitle>
                                    <CardDescription className="mt-1">
                                        Контакти і базові дані профілю
                                    </CardDescription>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                Дані профілю
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4 p-4">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <ProfileFact icon={Mail} label="Email" value={formData.email || "Немає"} />
                            <ProfileFact icon={Phone} label="Телефон" value={formData.phone_full || "Немає"} />
                            <ProfileFact icon={MapPin} label="Місто" value={formData.city || "Немає"} />
                            <ProfileFact
                                icon={School}
                                label="Школи"
                                value={showSchools ? String(formData.school_ids.length) : "Не використовується"}
                            />
                        </div>

                        <div className="grid min-w-0 gap-4 border-t pt-4 md:grid-cols-2">
                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="full_name" className="text-xs font-medium text-muted-foreground">
                                    Повне ім&apos;я *
                                </Label>

                                <Input
                                    id="full_name"
                                    className="h-10"
                                    value={formData.full_name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            full_name: e.target.value,
                                        }))
                                    }
                                    disabled={loadingUpdateProfile}
                                    placeholder="Іван Петров"
                                    required
                                />
                            </div>

                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email *</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="h-10"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                    disabled={loadingUpdateProfile}
                                    placeholder="example@email.com"
                                    required
                                />
                            </div>

                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">Телефон *</Label>

                                <PhoneInput
                                    defaultCountry="ua"
                                    value={formData.phone_full}
                                    onChange={(phone, meta) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            phone_full: phone,
                                            phone_separated: meta.inputValue,
                                        }));
                                    }}
                                    disabled={loadingUpdateProfile}
                                    required
                                    className="w-full min-w-0"
                                    inputClassName="w-full min-w-0"
                                    placeholder="+380 99 123 4567"
                                />
                            </div>

                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="date_of_birth" className="text-xs font-medium text-muted-foreground">Дата народження *</Label>

                                <Input
                                    id="date_of_birth"
                                    type="date"
                                    className="h-10"
                                    value={formData.date_of_birth}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            date_of_birth: e.target.value,
                                        }))
                                    }
                                    disabled={loadingUpdateProfile}
                                    required
                                />
                            </div>

                            <div className={showSchools ? "min-w-0 space-y-2" : "min-w-0 space-y-2 md:col-span-2"}>
                                <CityCombobox
                                    value={formData.city}
                                    onChange={(v) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            city: v,
                                        }))
                                    }
                                    options={CITY_OPTIONS}
                                    required
                                    label="Місто *"
                                    placeholder="Наприклад: Ужгород"
                                />
                            </div>

                            {showSchools && (
                                <div className="min-w-0 space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">Школи</Label>

                                    <MultiSchoolPicker
                                        value={formData.school_ids ?? []}
                                        onChange={(ids) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                school_ids: ids ?? [],
                                            }))
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                                type="submit"
                                disabled={loadingUpdateProfile}
                                className="min-w-[140px] cursor-pointer gap-2"
                            >
                                {loadingUpdateProfile ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Збереження...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Зберегти зміни
                                    </>
                                )}
                            </Button>

                            <Button
                                type="button"
                                className="cursor-pointer"
                                variant="outline"
                                onClick={() => setPasswordModalOpen(true)}
                            >
                                <KeyRound className="h-4 w-4" />
                                Змінити пароль
                            </Button>
                        </div>

                        {errorUpdate &&
                            !("data" in errorUpdate && (errorUpdate.data as any)?.detail) && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                                    Сталася помилка. Спробуйте ще раз пізніше.
                                </div>
                            )}
                    </CardContent>
                </Card>
            </form>

            <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Зміна паролю</DialogTitle>
                    </DialogHeader>

                    <HeaderStep step={step} descriptions={stepDescriptions} size="sm" />

                    {step === "send" && (
                        <FormStep
                            label="Email"
                            value={formData.email}
                            onChange={() => {}}
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendCode();
                            }}
                            buttonText="Надіслати код"
                            loading={sending}
                        />
                    )}

                    {step === "code" && (
                        <FormStep
                            label="Код"
                            value={code}
                            onChange={setCode}
                            onSubmit={handleCheckCode}
                            buttonText="Підтвердити код"
                            loading={checking}
                            placeholder_first="Введіть код"
                        />
                    )}

                    {step === "password" && (
                        <FormStep
                            label="Новий пароль"
                            type="password"
                            value={password}
                            onChange={setPassword}
                            secondLabel="Підтвердіть пароль"
                            secondValue={repeatPassword}
                            onSecondChange={setRepeatPassword}
                            onSubmit={handleChangePassword}
                            buttonText="Змінити пароль"
                            loading={resetting}
                            placeholder_first="Введіть пароль"
                            placeholder_second="Підтвердіть пароль"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function ProfileFact({
                         icon: Icon,
                         label,
                         value,
                     }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0 rounded-md border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
            </div>
            <p className="mt-1 truncate text-sm font-medium" title={value}>
                {value}
            </p>
        </div>
    );
}
