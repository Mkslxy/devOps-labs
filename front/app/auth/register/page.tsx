"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield } from "lucide-react";
import {
  emailRules,
  passwordRules,
  nameRules,
  phoneRules,
  dateOfBirthRules,
  validateForm,
} from "@/libs/validator-rules";
import {
  useRegisterUserMutation,
  useSendCodeMutation,
  useVerifyEmailWithCodeMutation,
} from "@/store/public.api";
import { useDispatch } from "react-redux";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { setUser } from "@/store/users/auth.slice";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export default function RegisterPage() {
  const [registerUser, { isLoading: loadingRegister, error: errorRegister }] =
    useRegisterUserMutation();

  const [sendCode, { isLoading: loadingSendCode, error: errorSendCode }] =
    useSendCodeMutation();
  const [
    verifyEmailWithCode,
    { isLoading: loadingVerifyEmailWithCode, error: errorVerifyEmailWithCode },
  ] = useVerifyEmailWithCodeMutation();

  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_full: "",
    phone_separated: "",
    password: "",
    confirmPassword: "",
    date_of_birth: "",
    code: "",
  });
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [sendCoolDown, setSendCoolDown] = useState(0);

  useEffect(() => {
    if (sendCoolDown > 0) {
      const timer = setTimeout(() => {
        setSendCoolDown(sendCoolDown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sendCoolDown]);

  const validationRules = {
    name: nameRules,
    email: emailRules,
    password: passwordRules,
    confirmPassword: [
      {
        test: (value: string) => value === formData.password,
        message: "Паролі не співпадають",
      },
    ],
    date_of_birth: dateOfBirthRules,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowAllErrors(true);

    const validationResult = validateForm(formData, validationRules);
    setErrors(validationResult.errors);

    if (!validationResult.isValid) {
      toast({
        title: "Помилка валідації",
        description: "Перевірте правильність заповнення полів",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendCode({ email: formData.email }).unwrap();

      toast({
        title: "Код успішно надіслано!",
        description: "Перевірте вашу пошту для підтвердження акаунту",
      });
      setSendCoolDown(60);
      setStep(2);
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося надіслати код підтвердження",
        variant: "destructive",
      });
    }
  };

  const getErrorClass = (field: string) => {
    return showAllErrors && errors[field]?.length
      ? "border-destructive focus-visible:ring-destructive"
      : "";
  };

  const handleResendCode = async () => {
    if (sendCoolDown > 0) return;

    try {
      await sendCode({ email: formData.email }).unwrap();

      toast({
        title: "Код надіслано знову!",
        description: "Перевірте вашу пошту",
      });

      setSendCoolDown(60);
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося надіслати код",
        variant: "destructive",
      });
    }
  };

  const handleVerifyCodeAndRegister = async () => {
    if (formData.code.length !== 6) {
      toast({
        title: "Помилка",
        description: "Введіть 6-значний код",
        variant: "destructive",
      });
      return;
    }

    try {
      const verifyResponse = await verifyEmailWithCode({
        email: formData.email,
        code: formData.code,
      }).unwrap();

      const token = verifyResponse.verification_token;

      toast({
        title: "Код підтверджено!",
        description: "Виконуємо реєстрацію...",
        variant: "default",
      });

      const countryCodeMatch = formData.phone_separated.match(/^\+\d+/);
      const countryCode = countryCodeMatch ? countryCodeMatch[0] : "";

      const nationalNumber = formData.phone_separated
        .replace(countryCode, "")
        .replace(/\D/g, "");

      const dataForRegister = {
        email: formData.email,
        full_name: formData.name,
        phone_country_code: countryCode,
        phone_national_number: nationalNumber,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        date_of_birth: formData.date_of_birth,
        verification_token: token,
      };

      const responseRegisterUser = await registerUser(dataForRegister).unwrap();

      dispatch(setUser(responseRegisterUser));
      toast({
        title: "Успіх! ",
        description: "Ви успішно зареєструвались",
        variant: "success",
      });

      if (responseRegisterUser.role.slug === "student") {
        router.push("/lms/student");
      } else if (responseRegisterUser.role.slug === "teacher") {
        router.push("/lms/teacher");
      } else {
        router.push("/dashboard/manager");
      }
    } catch (error: unknown) {
      console.error("Помилка підтвердження коду або реєстрації:", error);

      toast({
        title: "Помилка",
        description: "Помилка підтвердження коду при реєстрації",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center from-primary/5 via-background to-secondary/5 p-4">
      <LanguageSwitcher className="absolute right-4 top-4" />
      <Card className="w-full max-w-md">
        {step === 1 && (
          <>
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-2xl">
                    US
                  </span>
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Реєстрація</CardTitle>
              <CardDescription className="text-center">
                Створіть новий акаунт для навчання
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Повне ім'я *</Label>
                  <Input
                    id="name"
                    placeholder="Іван Петренко"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={getErrorClass("name")}
                    required
                  />
                  {showAllErrors &&
                    errors.name?.map((error, index) => (
                      <p key={index} className="text-sm text-destructive mt-1">
                        {error}
                      </p>
                    ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={getErrorClass("email")}
                    required
                  />
                  {showAllErrors &&
                    errors.email?.map((error, index) => (
                      <p key={index} className="text-sm text-destructive mt-1">
                        {error}
                      </p>
                    ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон *</Label>
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
                    required
                    inputClassName="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Дата народження *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date_of_birth: e.target.value,
                      })
                    }
                    className={getErrorClass("date_of_birth")}
                    required
                  />
                  {showAllErrors &&
                    errors.date_of_birth?.map((error, index) => (
                      <p key={index} className="text-sm text-destructive mt-1">
                        {error}
                      </p>
                    ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Пароль *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={getErrorClass("password")}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {showAllErrors &&
                    errors.password?.map((error, index) => (
                      <p key={index} className="text-sm text-destructive mt-1">
                        {error}
                      </p>
                    ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Підтвердіть пароль *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={getErrorClass("confirmPassword")}
                    required
                  />
                  {showAllErrors &&
                    errors.confirmPassword?.map((error, index) => (
                      <p key={index} className="text-sm text-destructive mt-1">
                        {error}
                      </p>
                    ))}
                </div>

                {errorSendCode && (
                  <p className="text-sm text-destructive mt-1">
                    {"status" in errorSendCode && errorSendCode.status === 500
                      ? "Внутрішня помилка сервера. Спробуйте пізніше."
                      : "Помилка. Пошта або номер телефону вже існують в системі."}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  size="lg"
                  disabled={loadingSendCode}
                >
                  {loadingSendCode ? "Надсилання..." : "Зареєструватись"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-center text-muted-foreground">
                Вже маєте акаунт?{" "}
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline font-medium"
                >
                  Увійти
                </Link>
              </div>
              <Link
                href="/"
                className="text-sm text-center text-muted-foreground hover:text-primary"
              >
                Повернутись на головну
              </Link>
            </CardFooter>
          </>
        )}
        {step === 2 && (
          <>
            <CardHeader className="space-y-4">
              <div className="flex justify-center mb-2">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <Shield className="w-10 h-10 text-primary" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-2xl text-center">
                Двофакторна автентифікація
              </CardTitle>
              <CardDescription className="text-center text-base">
                Для захисту вашого акаунта ми надіслали код підтвердження на
                вашу пошту
                <span className="block font-medium text-foreground mt-1">
                  {formData.email}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="verificationCode" className="text-base">
                  Введіть 6-значний код *
                </Label>
                <div className="flex justify-center">
                  <Input
                    id="verificationCode"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={formData.code}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        code: e.target.value,
                      });
                    }}
                    className="w-48 text-center text-2xl font-mono tracking-widest h-12"
                    autoFocus
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Код дійсний протягом 10 хвилин
                </p>
              </div>
              <div className="space-y-4">
                <Button
                  id="verify-button"
                  type="submit"
                  className="w-full cursor-pointer"
                  size="lg"
                  onClick={handleVerifyCodeAndRegister}
                  disabled={
                    loadingVerifyEmailWithCode ||
                    formData.code.length !== 6 ||
                    loadingRegister
                  }
                >
                  {loadingVerifyEmailWithCode || loadingRegister
                    ? "Підтвердження..."
                    : "Підтвердити код "}
                </Button>

                <div className="text-center space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Не отримали код?
                    <Button
                      type="button"
                      variant="link"
                      className="px-2 py-0 h-auto font-medium cursor-pointer"
                      onClick={handleResendCode}
                      disabled={sendCoolDown > 0 || loadingSendCode}
                    >
                      Надіслати знову
                      {sendCoolDown > 0 && ` (${sendCoolDown}с)`}
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full cursor-pointer"
                    onClick={() => {
                      setStep(1);
                      formData.code = "";
                    }}
                  >
                    Повернутись до реєстрації
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
