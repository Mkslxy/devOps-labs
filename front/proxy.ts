import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.API_INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
const PUBLIC_LMS_ROUTES = ["/lms/google/callback"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_LMS_ROUTES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let isAuthenticated = false;
  let userRole: string | undefined;

  try {
    const response = await fetch(`${API_URL}/profile/me/`, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    if (response.ok) {
      const user = await response.json();
      isAuthenticated = true;
      userRole = user.role?.slug;
    }
  } catch {}

  if (pathname === "/" || pathname.startsWith("/auth")) {
    if (isAuthenticated) {
      return redirectToDefaultRoute(request, userRole);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/lms") || pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      return redirectToLogin(request, pathname);
    }

    if (!hasAccessToRoute(pathname, userRole)) {
      return redirectToDefaultRoute(request, userRole);
    }
  }

  return NextResponse.next();
}

function hasAccessToRoute(pathname: string, role?: string) {
  if (pathname.startsWith("/lms/google/callback")) return true;

  if (!role) return false;

  if (role === "student") {
    return pathname.startsWith("/lms/student");
  }

  if (role === "teacher") {
    return pathname.startsWith("/lms/teacher");
  }

  if (["admin", "manager", "methodist", "financier", "director", "tutor"].includes(role)) {
    return pathname.startsWith("/dashboard/manager");
  }

  return false;
}

function redirectToLogin(request: NextRequest, redirectPath: string) {
  const url = new URL("/auth/login", request.url);
  url.searchParams.set("redirect", redirectPath);
  return NextResponse.redirect(url);
}

function redirectToDefaultRoute(request: NextRequest, role?: string) {
  let route = "/";

  switch (role) {
    case "student":
      route = "/lms/student";
      break;
    case "teacher":
      route = "/lms/teacher";
      break;
    case "admin":
    case "manager":
    case "methodist":
    case "financier":
    case "director":
    case "tutor":
      route = "/dashboard/manager";
      break;
  }

  return NextResponse.redirect(new URL(route, request.url));
}

export const config = {
  matcher: ["/", "/auth/:path*", "/lms/:path*", "/dashboard/:path*"],
};
