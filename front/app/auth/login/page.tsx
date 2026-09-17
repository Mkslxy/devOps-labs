"use client";

import type React from "react";
import { useState } from "react";
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
import { Eye, EyeOff } from "lucide-react";
import { useLoginUserMutation } from "@/store/public.api";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/users/auth.slice";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loginUser, { isLoading, error }] = useLoginUserMutation();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await loginUser(formData).unwrap();
      dispatch(setUser(response.user));
      toast({
        title: "Успіх! ",
        description: "Ви успішно увійшли до системи.",
        variant: "success",
      });
      if (response.user.role.slug === "student") {
        router.push("/lms/student");
      } else if (response.user.role.slug === "teacher") {
        router.push("/lms/teacher");
      } else {
        router.push("/dashboard/manager");
      }
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Помилка під час входу",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center from-primary/5 via-background to-secondary/5 p-4">
      <LanguageSwitcher className="absolute right-4 top-4" />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">
                US
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Вхід в систему</CardTitle>
          <CardDescription className="text-center">
            Введіть ваші дані для входу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
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
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/auth/forgot-password/"
                className="text-sm text-primary hover:underline"
              >
                Забули пароль?
              </Link>
            </div>

            {error && (
              <span className="text-red-500 text-sm">
                {"status" in error && error.status === 500
                  ? "Внутрішня помилка сервера. Спробуйте пізніше."
                  : "Помилка входу. Перевірте правильність даних."}
              </span>
            )}

            <Button
              type="submit"
              className="w-full cursor-pointer mt-3"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Входимо..." : "Увійти"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Не маєте акаунту?{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:underline font-medium"
            >
              Зареєструватись
            </Link>
          </div>
          <Link
            href="/"
            className="text-sm text-center text-muted-foreground hover:text-primary"
          >
            Повернутись на головну
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
