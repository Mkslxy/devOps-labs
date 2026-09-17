"use client";

import type React from "react";
import { useMemo, useState } from "react";
import type { ParsedCountry } from "react-international-phone";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CityCombobox, normalizeCity } from "@/components/ui/CityCombobox";
import { useCreateCallbackRequestMutation } from "@/store/leads/lead.api";
import { CallBackRequestStatusEnum, ContactPreferenceEnum, type CallBackPayload } from "@/store/leads/lead.type";

export const CITY_OPTIONS = [
  "Київ",
  "Львів",
  "Харків",
  "Одеса",
  "Дніпро",
  "Запоріжжя",
  "Вінниця",
  "Івано-Франківськ",
  "Тернопіль",
  "Ужгород",
  "Чернівці",
] as const;

const trialBenefits = [
  "Безкоштовний пробний урок 45 хвилин",
  "Визначення вашого рівня знань",
  "Індивідуальна програма навчання",
  "Доступ до платформи на 7 днів",
];

function onlyDigits(value: string) {
  return (value || "").replace(/[^\d]/g, "");
}

type FieldErrors = Partial<Record<"name" | "city" | "phone" | "otherContact", string>>;
type PhoneCountry = ParsedCountry & { dialCode?: string | number };

export function ContactForm() {
  const { toast } = useToast();
  const [createCallbackRequest, { isLoading }] = useCreateCallbackRequestMutation();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    city: "",
    message: "",
    otherContact: "",
  });
  const [phoneE164, setPhoneE164] = useState("");
  const [phoneMeta, setPhoneMeta] = useState<{
    country: ParsedCountry | null;
    inputValue: string;
  }>({ country: null, inputValue: "" });
  const [contactPreference, setContactPreference] = useState<ContactPreferenceEnum>(ContactPreferenceEnum.phone);

  const callbackPageUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  const isOtherPreferred = contactPreference === ContactPreferenceEnum.other;

  const validate = () => {
    const nextErrors: FieldErrors = {};
    const digits = onlyDigits(phoneE164);
    const dialCode = phoneMeta.country ? String((phoneMeta.country as PhoneCountry).dialCode || "") : "";
    const national = dialCode && digits.startsWith(dialCode) ? digits.slice(dialCode.length) : digits;

    if (!formData.name.trim()) nextErrors.name = "Вкажіть ім'я.";
    if (!normalizeCity(formData.city)) nextErrors.city = "Оберіть місто.";
    if (!dialCode || !national) nextErrors.phone = "Вкажіть коректний телефон.";
    if (isOtherPreferred && !formData.otherContact.trim()) {
      nextErrors.otherContact = "Вкажіть контакт для обраного способу зв'язку.";
    }

    setErrors(nextErrors);
    return { isValid: Object.keys(nextErrors).length === 0, dialCode, national };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = validate();

    if (!result.isValid) return;

    const payload: CallBackPayload = {
      full_name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone_country_code: result.dialCode,
      phone_national_number: result.national,
      message: formData.message.trim() || undefined,
      contact_preference: [contactPreference],
      other_contact_preference: isOtherPreferred ? formData.otherContact.trim() : undefined,
      status: [CallBackRequestStatusEnum.new],
      callback_page: callbackPageUrl,
      city: normalizeCity(formData.city),
    };

    try {
      await createCallbackRequest(payload).unwrap();
      toast({
        title: "Заявку відправлено!",
        description: "Менеджер зв'яжеться з вами найближчим часом.",
      });
      setFormData({ name: "", email: "", city: "", message: "", otherContact: "" });
      setContactPreference(ContactPreferenceEnum.phone);
      setPhoneE164("");
      setPhoneMeta({ country: null, inputValue: "" });
      setErrors({});
    } catch {
      toast({
        title: "Не вдалося відправити заявку",
        description: "Перевірте дані та спробуйте ще раз.",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="contact" className="bg-muted/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_0.95fr]">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-xl">
            <CardContent className="flex h-full flex-col justify-center gap-7 p-6 md:p-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold md:text-4xl">
                  Спробуйте безкоштовно!
                </h2>
                <p className="max-w-xl text-base leading-7 opacity-90 md:text-lg">
                  Запишіться на пробний урок, визначте рівень і отримайте персональну програму навчання.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {trialBenefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                    <span className="text-sm leading-6">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" variant="secondary" className="w-fit px-8 text-base">
                Записатись на урок
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Залишити заявку</CardTitle>
              <CardDescription className="text-base leading-7">
                Заповніть форму, і менеджер зв'яжеться з вами протягом 15 хвилин.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="name" required>Ім'я</RequiredLabel>
                  <Input
                    id="name"
                    placeholder="Введіть ваше ім'я"
                    value={formData.name}
                    onChange={(event) => {
                      setFormData({ ...formData, name: event.target.value });
                      setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    aria-invalid={!!errors.name}
                    className="h-11"
                  />
                  {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="email">Email</RequiredLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <CityCombobox
                      value={formData.city}
                      onChange={(value) => {
                        setFormData({ ...formData, city: value });
                        setErrors((prev) => ({ ...prev, city: undefined }));
                      }}
                      options={CITY_OPTIONS}
                      required
                      label="Місто *"
                      placeholder="Наприклад: Ужгород"
                    />
                    {errors.city ? <p className="text-sm text-destructive">{errors.city}</p> : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <RequiredLabel required>Телефон</RequiredLabel>
                  <PhoneInput
                    defaultCountry="ua"
                    value={phoneE164}
                    onChange={(phone, meta) => {
                      setPhoneE164(phone);
                      setPhoneMeta(meta);
                      setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    inputProps={{ placeholder: "+380 XX XXX XX XX" }}
                    className="w-full"
                  />
                  {errors.phone ? <p className="text-sm text-destructive">{errors.phone}</p> : null}
                </div>

                <div className="space-y-2">
                  <RequiredLabel required>Як з вами зв'язатися?</RequiredLabel>
                  <Select
                    value={contactPreference}
                    onValueChange={(value) => {
                      const next = value as ContactPreferenceEnum;
                      setContactPreference(next);
                      if (next !== ContactPreferenceEnum.other) {
                        setFormData((prev) => ({ ...prev, otherContact: "" }));
                        setErrors((prev) => ({ ...prev, otherContact: undefined }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Оберіть спосіб" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ContactPreferenceEnum.phone}>Телефон</SelectItem>
                      <SelectItem value={ContactPreferenceEnum.email}>Пошта</SelectItem>
                      <SelectItem value={ContactPreferenceEnum.other}>Інше</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isOtherPreferred ? (
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="otherContact" required>Контакт для способу "Інше"</RequiredLabel>
                    <Input
                      id="otherContact"
                      placeholder="Telegram @username / Viber / WhatsApp"
                      value={formData.otherContact}
                      onChange={(event) => {
                        setFormData({ ...formData, otherContact: event.target.value });
                        setErrors((prev) => ({ ...prev, otherContact: undefined }));
                      }}
                      aria-invalid={!!errors.otherContact}
                      className="h-11"
                    />
                    {errors.otherContact ? <p className="text-sm text-destructive">{errors.otherContact}</p> : null}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <RequiredLabel htmlFor="message">Коментар</RequiredLabel>
                  <Textarea
                    id="message"
                    placeholder="Розкажіть про ваші цілі навчання..."
                    value={formData.message}
                    onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                    className="min-h-[120px]"
                  />
                </div>

                <Button type="submit" size="lg" className="h-11 w-full" disabled={isLoading}>
                  {isLoading ? "Відправляємо..." : "Відправити заявку"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
