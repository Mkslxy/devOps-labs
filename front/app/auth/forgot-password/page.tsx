"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  useResetSendCodeMutation,
  useResetCheckCodeMutation,
  useResetPasswordMutation,
} from "@/store/public.api";
import { FormStep } from "@/components/reset-password/formStep";
import { HeaderStep } from "@/components/reset-password/headerStep";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

type Step = "email" | "code" | "password";

const stepDescriptions: Record<Step, string> = {
  email: "Введіть вашу пошту",
  code: "Введіть код з пошти",
  password: "Введіть новий пароль",
};

export default function ForgotPasswordPage() {
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [sendCode, { isLoading: isSending }] = useResetSendCodeMutation();
  const [checkCode, { isLoading: isChecking }] = useResetCheckCodeMutation();
  const [resetPassword, { isLoading: isResetting }] =
    useResetPasswordMutation();

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendCode({ email }).unwrap();
      toast({
        title: "Код надіслано",
        description: "Перевірте вашу пошту",
      });
      setStep("code");
    } catch {
      toast({
        title: "Помилка",
        description: "Не вдалося надіслати код",
        variant: "destructive",
      });
    }
  };

  const handleCheckCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await checkCode({ email, code }).unwrap();
      toast({
        title: "Код підтверджено",
        variant: "success",
      });
      setStep("password");
    } catch {
      toast({
        title: "Невірний код",
        description: "Спробуйте ще раз",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword({
        email: email,
        code: code,
        password: password,
        repeat_password: repeatPassword,
      }).unwrap();
      toast({
        title: "Готово",
        description: "Пароль успішно змінено",
        variant: "success",
      });
      setStep("email");
      setEmail("");
      setCode("");
      setPassword("");
    } catch {
      toast({
        title: "Помилка",
        description: "Не вдалося змінити пароль",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <LanguageSwitcher className="absolute right-4 top-4" />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <HeaderStep
            title="Відновлення паролю"
            step={step}
            descriptions={stepDescriptions}
            size="md"
          />
        </CardHeader>

        <CardContent>
          {step === "email" && (
            <FormStep
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              onSubmit={handleSendEmail}
              buttonText="Надіслати код"
              loading={isSending}
              placeholder_first="Введіть email"
            />
          )}

          {step === "code" && (
            <FormStep
              label="Код"
              value={code}
              onChange={setCode}
              onSubmit={handleCheckCode}
              buttonText="Підтвердити код"
              loading={isChecking}
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
              onSubmit={handleResetPassword}
              buttonText="Змінити пароль"
              loading={isResetting}
              placeholder_first="Введіть пароль"
              placeholder_second="Підтвердіть пароль"
            />
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Повернутись до входу
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
