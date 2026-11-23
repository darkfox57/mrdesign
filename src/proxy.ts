import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);
const ADMIN_LOGIN_PATH = "/admin/login";
// Admin pages reachable without a session: the login and the forgotten-password flow.
const PUBLIC_ADMIN_PATHS = [ADMIN_LOGIN_PATH, "/admin/recuperar", "/admin/restablecer"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The admin lives outside the locale routing. This is only an optimistic cookie check:
  // layouts, pages and server actions validate the session, role and ban status on every request.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (PUBLIC_ADMIN_PATHS.includes(pathname) || getSessionCookie(request)) return NextResponse.next();
    const login = new URL(ADMIN_LOGIN_PATH, request.url);
    login.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  return intl(request);
}

export const config = {
  // Skip API routes, Next internals and files with an extension (images, fonts, favicon).
  // Keep the double backslash: it is the regex "\." (a literal dot).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
