"use client";

export const languages = ["uk", "en"] as const;

export type Language = (typeof languages)[number];

export const defaultLanguage: Language = "uk";

export const languageLabels: Record<Language, string> = {
  uk: "UA",
  en: "EN",
};

export const languageNames: Record<Language, string> = {
  uk: "Українська",
  en: "English",
};

export function isLanguage(value: string | null): value is Language {
  return value === "uk" || value === "en";
}

const cp1251ToUnicode = [
  0x0402, 0x0403, 0x201a, 0x0453, 0x201e, 0x2026, 0x2020, 0x2021,
  0x20ac, 0x2030, 0x0409, 0x2039, 0x040a, 0x040c, 0x040b, 0x040f,
  0x0452, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x0098, 0x2122, 0x0459, 0x203a, 0x045a, 0x045c, 0x045b, 0x045f,
  0x00a0, 0x040e, 0x045e, 0x0408, 0x00a4, 0x0490, 0x00a6, 0x00a7,
  0x0401, 0x00a9, 0x0404, 0x00ab, 0x00ac, 0x00ad, 0x00ae, 0x0407,
  0x00b0, 0x00b1, 0x0406, 0x0456, 0x0491, 0x00b5, 0x00b6, 0x00b7,
  0x0451, 0x2116, 0x0454, 0x00bb, 0x0458, 0x0405, 0x0455, 0x0457,
  0x0410, 0x0411, 0x0412, 0x0413, 0x0414, 0x0415, 0x0416, 0x0417,
  0x0418, 0x0419, 0x041a, 0x041b, 0x041c, 0x041d, 0x041e, 0x041f,
  0x0420, 0x0421, 0x0422, 0x0423, 0x0424, 0x0425, 0x0426, 0x0427,
  0x0428, 0x0429, 0x042a, 0x042b, 0x042c, 0x042d, 0x042e, 0x042f,
  0x0430, 0x0431, 0x0432, 0x0433, 0x0434, 0x0435, 0x0436, 0x0437,
  0x0438, 0x0439, 0x043a, 0x043b, 0x043c, 0x043d, 0x043e, 0x043f,
  0x0440, 0x0441, 0x0442, 0x0443, 0x0444, 0x0445, 0x0446, 0x0447,
  0x0448, 0x0449, 0x044a, 0x044b, 0x044c, 0x044d, 0x044e, 0x044f,
];

const unicodeToCp1251 = new Map<number, number>(
  cp1251ToUnicode.map((codePoint, index) => [codePoint, index + 0x80])
);

function cp1251ByteFor(char: string) {
  const code = char.codePointAt(0);
  if (code === undefined) return undefined;
  if (code <= 0x7f) return code;
  return unicodeToCp1251.get(code);
}

function looksLikeMojibake(value: string) {
  return /[РСÐÑ][\u0400-\u04ff\u2018-\u201d\u20ac\u2122]*|вЂ|в‚|В©/.test(value);
}

export function normalizeMojibake(value: string) {
  if (!looksLikeMojibake(value)) return value;

  const bytes: number[] = [];
  for (const char of value) {
    const byte = cp1251ByteFor(char);
    if (byte === undefined) return value;
    bytes.push(byte);
  }

  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(bytes)
    );
    return decoded.includes("\uFFFD") ? value : decoded;
  } catch {
    return value;
  }
}

const commonTranslations: Record<string, string> = {
  "Головна": "Home",
  "Курси": "Courses",
  "Про нас": "About us",
  "Контакти": "Contacts",
  "Вхід": "Log in",
  "Вхід в систему": "Log in",
  "Реєстрація": "Registration",
  "Увійти": "Log in",
  "Зареєструватись": "Create account",
  "Повернутись на головну": "Back to home",
  "Повернутись до входу": "Back to login",
  "Забули пароль?": "Forgot password?",
  "Не маєте акаунту?": "No account?",
  "Вже маєте акаунт?": "Already have an account?",
  "Введіть ваші дані для входу": "Enter your details to log in",
  "Пароль": "Password",
  "Новий пароль": "New password",
  "Підтвердіть пароль": "Confirm password",
  "Повне ім'я": "Full name",
  "Телефон": "Phone",
  "Дата народження": "Date of birth",
  "Код": "Code",
  "Відновлення паролю": "Password recovery",
  "Введіть вашу пошту": "Enter your email",
  "Введіть код з пошти": "Enter the email code",
  "Введіть новий пароль": "Enter a new password",
  "Надіслати код": "Send code",
  "Підтвердити код": "Confirm code",
  "Змінити пароль": "Change password",
  "Завантаження...": "Loading...",
  "Помилка": "Error",
  "Успіх!": "Success!",
  "Готово": "Done",
  "Пошук...": "Search...",
  "Сповіщення": "Notifications",
  "Мова інтерфейсу": "Interface language",
  "Відкрити меню": "Open menu",
  "Навігація": "Navigation",
  "Вийти": "Log out",
  "Користувач": "User",
  "Студент": "Student",
  "Викладач": "Teacher",
  "Менеджер": "Manager",
  "Фінансист": "Financier",
  "Методист": "Methodist",
  "Директор": "Director",
  "Основне": "Main",
  "Навчання": "Learning",
  "Завдання": "Tasks",
  "Аналітика": "Analytics",
  "Користувачі": "Users",
  "Платежі": "Payments",
  "Профіль": "Profile",
  "Мій абонемент": "My subscription",
  "Розклад": "Schedule",
  "Журнал": "Gradebook",
  "Мої тести": "My tests",
  "Домашні завдання": "Homework",
  "Завдання курсів": "Course tasks",
  "Прогрес": "Progress",
  "Мої студенти": "My students",
  "Курси та матеріали": "Courses and materials",
  "Предмети": "Subjects",
  "Теми": "Topics",
  "Управління тестами": "Test management",
  "Імпорт курсів": "Course import",
  "Імпорт тестів": "Test import",
  "Студенти": "Students",
  "Викладачі": "Teachers",
  "Ліди": "Leads",
  "Журнал викладачів": "Teacher gradebook",
  "Групи": "Groups",
  "Школи": "Schools",
  "Абонементи": "Subscriptions",
  "Призначення абонементів": "Subscription assignments",
  "Понад 10 000 студентів по всьому світу": "Over 10,000 students worldwide",
  "Вивчайте мови онлайн з професійними викладачами":
    "Learn languages online with professional teachers",
  "Персоналізовані уроки, гнучкий розклад та перевірені методики для швидкого результату.":
    "Personalized lessons, flexible scheduling, and proven methods for fast progress.",
  "Записатись на урок": "Book a lesson",
  "Безкоштовний урок": "Free lesson",
  "Професійних викладачів": "Professional teachers",
  "Задоволених студентів": "Satisfied students",
  "Онлайн класи": "Online classes",
  "24/7 доступ": "24/7 access",
  "мов навчання": "languages available",
  "Чому обирають нас?": "Why choose us?",
  "Ми пропонуємо зрозумілу систему навчання, живу підтримку та прозорий прогрес.":
    "We offer a clear learning system, live support, and transparent progress.",
  "Інтерактивні уроки": "Interactive lessons",
  "Гнучкий розклад": "Flexible schedule",
  "Власна платформа": "Own platform",
  "Групові та індивідуальні": "Group and individual",
  "Підтримка": "Support",
  "Сертифікати": "Certificates",
  "Наші курси": "Our courses",
  "Оберіть мову та рівень, який підходить вашим цілям.":
    "Choose the language and level that fit your goals.",
  "Англійська": "English",
  "Німецька": "German",
  "Французька": "French",
  "Початковий": "Beginner",
  "Середній": "Intermediate",
  "Просунутий": "Advanced",
  "Тривалість": "Duration",
  "3 місяці": "3 months",
  "4 місяці": "4 months",
  "5 місяців": "5 months",
  "студентів": "students",
  "Записатись на курс": "Enroll in course",
  "Переглянути всі курси": "View all courses",
  "Спробуйте безкоштовно!": "Try it for free!",
  "Залишити заявку": "Leave a request",
  "Заповніть форму, і менеджер зв'яжеться з вами протягом 15 хвилин.":
    "Fill out the form and a manager will contact you within 15 minutes.",
  "Ім'я": "Name",
  "Місто": "City",
  "Як з вами зв'язатися?": "How should we contact you?",
  "Оберіть спосіб": "Choose a method",
  "Пошта": "Email",
  "Інше": "Other",
  "Коментар": "Comment",
  "Відправити заявку": "Send request",
  "Відправляємо...": "Sending...",
  "Пробний урок": "Trial lesson",
  "Ціни": "Pricing",
  "Про школу": "About school",
  "Відгуки": "Reviews",
  "Блог": "Blog",
  "Соціальні мережі": "Social media",
  "Всі права захищені.": "All rights reserved.",
};

const phrasePatterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^Тривалість: (.+)$/u, (match) => `Duration: ${translateText(match[1], "en")}`],
  [/^(\d+)\s+студентів$/u, (match) => `${match[1]} students`],
  [/^(.+)\s+\/міс$/u, (match) => `${match[1]} /mo`],
  [/^Надіслати знову \((\d+)с\)$/u, (match) => `Send again (${match[1]}s)`],
];

export function translateText(value: string, language: Language) {
  const normalized = normalizeMojibake(value).replace(/\s+/g, " ").trim();
  if (!normalized) return value;
  if (language === "uk") return normalized;

  const direct = commonTranslations[normalized];
  if (direct) return direct;

  for (const [pattern, translate] of phrasePatterns) {
    const match = normalized.match(pattern);
    if (match) return translate(match);
  }

  return normalized;
}
