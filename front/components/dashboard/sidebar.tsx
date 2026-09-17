"use client";

import React, {useEffect, useMemo, useState} from "react";
import {cn} from "@/libs/utils";
import {Button} from "@/components/ui/button";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useSelector, useDispatch} from "react-redux";
import {
  BarChart,
  BarChart3,
  BanknoteIcon,
  BookOpen,
  BookOpenCheck,
  Calendar,
  ClipboardCheck,
  CreditCard,
  FileText,
  Folder,
  GraduationCap,
  LayoutDashboard,
  Layers,
  List,
  LogOut,
  Menu,
  School,
  Send,
  Settings,
  UserCheck,
  UserPlus,
  Users,
  WalletCards,
  Sparkles,
} from "lucide-react";
import {RootState} from "@/store/store";
import {clearUser, getUserFromStorage} from "@/store/users/auth.slice";
import {useLogoutUserMutation} from "@/store/public.api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const studentNavigation: NavSection[] = [
  {
    title: "Основне",
    items: [
      { href: "/lms/student", icon: LayoutDashboard, label: "Головна" },
      { href: "/lms/student/profile", icon: Settings, label: "Профіль" },
    ],
  },
  {
    title: "Навчання",
    items: [
      { href: "/lms/student/subscription", icon: WalletCards, label: "Мій абонемент" },
      { href: "/lms/student/calendar", icon: Calendar, label: "Розклад" },
      { href: "/lms/student/gradebook", icon: BookOpenCheck, label: "Журнал" },
      { href: "/lms/student/courses", icon: List, label: "Курси" },
    ],
  },
  {
    title: "Завдання",
    items: [
      { href: "/lms/student/tests", icon: BookOpen, label: "Мої тести" },
      { href: "/lms/student/homework", icon: FileText, label: "Домашні завдання" },
      { href: "/lms/student/course-task", icon: ClipboardCheck, label: "Завдання курсів" },
    ],
  },
  {
    title: "Аналітика",
    items: [
      { href: "/lms/student/progress", icon: BarChart, label: "Прогрес" },
    ],
  },
];

const teacherNavigation: NavSection[] = [
  {
    title: "Основне",
    items: [
      { href: "/lms/teacher", icon: LayoutDashboard, label: "Головна" },
      { href: "/lms/teacher/profile", icon: Settings, label: "Профіль" },
      { href: "/lms/teacher/calendar", icon: Calendar, label: "Розклад" },
    ],
  },
  {
    title: "Навчання",
    items: [
      { href: "/lms/teacher/gradebook", icon: BookOpenCheck, label: "Журнал" },
      { href: "/lms/teacher/students", icon: Users, label: "Мої студенти" },
      { href: "/lms/teacher/courses", icon: List, label: "Курси та матеріали" },
      { href: "/lms/teacher/subjects", icon: School, label: "Предмети" },
      { href: "/lms/teacher/topic", icon: Folder, label: "Теми" },
    ],
  },
  {
    title: "Завдання",
    items: [
      { href: "/lms/teacher/test-management", icon: BookOpen, label: "Управління тестами" },
      { href: "/lms/teacher/homework", icon: GraduationCap, label: "Домашні завдання" },
      { href: "/lms/teacher/course-task", icon: ClipboardCheck, label: "Завдання курсів" },
    ],
  },
  {
    title: "Magic Import",
    items: [
      { href: "/lms/teacher/magic-import/courses", icon: Sparkles, label: "Імпорт курсів" },
      { href: "/lms/teacher/magic-import/tests", icon: Sparkles, label: "Імпорт тестів" },
    ],
  },
];

const managerNavigation: NavSection[] = [
  {
    title: "Основне",
    items: [
      { href: "/dashboard/manager", icon: LayoutDashboard, label: "Головна" },
      { href: "/dashboard/manager/profile", icon: Settings, label: "Профіль" },
      { href: "/dashboard/manager/calendar", icon: Calendar, label: "Розклад" },
      { href: "/dashboard/manager/telegram", icon: Send, label: "Telegram" },
    ],
  },
  {
    title: "Користувачі",
    items: [
      { href: "/dashboard/manager/students", icon: Users, label: "Студенти" },
      { href: "/dashboard/manager/teachers", icon: GraduationCap, label: "Викладачі" },
      { href: "/dashboard/manager/leads", icon: UserPlus, label: "Ліди" },
    ],
  },
  {
    title: "Навчання",
    items: [
      { href: "/dashboard/manager/teachers-gradebook", icon: BookOpenCheck, label: "Журнал викладачів" },
      { href: "/dashboard/manager/groups", icon: Layers, label: "Групи" },
      { href: "/dashboard/manager/school", icon: School, label: "Школи" },
    ],
  },
  {
    title: "Платежі",
    items: [
      { href: "/dashboard/manager/subscription", icon: CreditCard, label: "Абонементи" },
      { href: "/dashboard/manager/subscription/student-subscriptions", icon: UserCheck, label: "Призначення абонементів" },
    ],
  },
  {
    title: "Фінанси",
    items: [
      { href: "/dashboard/manager/pnl", icon: BanknoteIcon, label: "Доходи та витрати" },
    ],
  },
  {
    title: "Magic Import",
    items: [
      { href: "/dashboard/manager/magic-import/courses", icon: Sparkles, label: "Імпорт курсів" },
      { href: "/dashboard/manager/magic-import/tests", icon: Sparkles, label: "Імпорт тестів" },
    ],
  },
];



const publicNavigation: NavSection[] = [
  {
    title: "Навігація",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Головна" },
      { href: "/auth/login", icon: Settings, label: "Увійти" },
    ],
  },
];

function roleLabel(roleSlug?: string) {
  if (roleSlug === "student") return "Студент";
  if (roleSlug === "teacher") return "Викладач";
  if (roleSlug === "manager") return "Менеджер";
  if (roleSlug === "financier") return "Фінансист";
  if (roleSlug === "methodist") return "Методист";
  if (roleSlug === "director") return "Директор";
  return "Користувач";
}

function getInitials(fullName?: string | null) {
  if (!fullName?.trim()) return "US";
  return fullName
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isActive(pathname: string, href: string) {
  const exact = [
    "/", 
    "/lms/student", 
    "/lms/teacher", 
    "/dashboard/manager",
    "/dashboard/manager/subscription"
  ];
  if (exact.includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  navigation,
  pathname,
  role,
  initials,
  fullName,
  onNavigate,
  onLogout,
}: {
  navigation: NavSection[];
  pathname: string;
  role: string;
  initials: string;
  fullName?: string | null;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6">
      <Link
        href="/"
        className="flex items-center gap-3 px-2"
        onClick={onNavigate}
      >
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
          US
        </div>
        <div className="min-w-0">
          <div className="text-lg font-bold leading-6">UniSchool</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
      </Link>

      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
        {navigation.map((section) => (
          <div key={section.title} className="space-y-2">
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted hover:text-primary"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {fullName || "Користувач"}
            </div>
            <div className="truncate text-xs text-muted-foreground">{role}</div>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={onLogout}
        >
          <LogOut className="size-4" />
          Вийти
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [logoutUser] = useLogoutUserMutation();
  const [loaded, setLoaded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const roleSlug = user?.role?.slug;

  useEffect(() => {
    dispatch(getUserFromStorage());
    setLoaded(true);
  }, [dispatch]);

  const role = useMemo(() => {
    if (!user) return "Не авторизований";

    if (roleSlug === "manager") return "Менеджер";
    if (roleSlug === "financier") return "Фінансист";
    if (roleSlug === "student") return "Студент";
    if (roleSlug === "teacher") return "Викладач";
    if (roleSlug === "methodist") return "Методист";

    return "Користувач";
  }, [user, roleSlug]);

  const userInitials = useMemo(() => {
    const fullName = user?.full_name?.trim();

    if (!fullName) return "U";

    return (
      fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((name) => name[0])
        .join("")
        .toUpperCase() || "U"
    );
  }, [user]);

  const navigation = useMemo<NavSection[]>(() => {
    if (!loaded) return [];
    if (!user) return publicNavigation;

    switch (roleSlug) {
      case "student":   return studentNavigation;
      case "teacher":   return teacherNavigation;
      case "manager":
      case "financier":
      case "methodist":
      case "director":
      case "admin":
      case "tutor":
        return managerNavigation;
      default:          
        return publicNavigation;
    }
  }, [loaded, user, roleSlug]);

  const fullName = user?.full_name;
  const initials = getInitials(fullName);

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
    } catch {
    }

    dispatch(clearUser());
    setMobileOpen(false);
    window.location.href = "/";
  };

  const isActiveLink = (href: string) => isActive(pathname, href);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 h-14 border-b bg-card lg:hidden">
        <div className="flex h-full items-center justify-between px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Відкрити меню"
              >
                <Menu className="h-5 w-5"/>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Навігація</SheetTitle>
              </SheetHeader>

              <aside className="flex min-h-0 w-full flex-1 flex-col bg-card">
                <div className="border-b p-6">
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                                            <span className="text-xl font-bold text-primary-foreground">
                                                LS
                                            </span>
                    </div>

                    <span className="text-lg font-bold">
                                            Language School
                                        </span>
                  </Link>
                </div>

                <div className="border-b p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      {user ? (
                        <>
                          <p className="truncate font-medium">
                            {user.full_name ||
                              "Немає"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {role}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="truncate font-medium">
                            Гість
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {role}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <nav
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <div className="space-y-5">
                    {navigation.map((group) => (
                      <div
                        key={group.title}
                        className="space-y-1"
                      >
                        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {group.title}
                        </p>

                        <ul className="space-y-1">
                          {group.items.map((item) => {
                            const active =
                              isActiveLink(
                                item.href
                              );

                            return (
                              <li key={item.href}>
                                <Link
                                  href={
                                    item.href
                                  }
                                  onClick={() =>
                                    setMobileOpen(
                                      false
                                    )
                                  }
                                  className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                    active
                                      ? "pointer-events-none bg-primary text-primary-foreground"
                                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                  )}
                                >
                                  <item.icon className="h-5 w-5 shrink-0"/>
                                  <span className="truncate">
                                                                        {
                                                                          item.label
                                                                        }
                                                                    </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </nav>

                {user && (
                  <div className="border-t p-4">
                    <Button
                      variant="ghost"
                      className="w-full cursor-pointer justify-start gap-3 bg-transparent"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5"/>
                      <span>Вийти</span>
                    </Button>
                  </div>
                )}
              </aside>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              US
            </div>
            <span className="font-bold">UniSchool</span>
          </Link>
          <div className="size-9" />
        </div>
      </div>

      <aside className="hidden h-dvh w-72 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              {user ? (
                <>
                  <p className="truncate font-medium">
                    {user.full_name || "Немає"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {role}
                  </p>
                </>
              ) : (
                <>
                  <p className="truncate font-medium">
                    Гість
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {role}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <nav
          className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-5">
            {navigation.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </p>

                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActiveLink(
                      item.href
                    );

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            active
                              ? "pointer-events-none bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0"/>
                          <span className="truncate">
                                                        {item.label}
                                                    </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {user && (
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full cursor-pointer justify-start gap-3 bg-transparent"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5"/>
              <span>Вийти</span>
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
