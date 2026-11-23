import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API routes, the admin, Next internals and files with an extension (images, fonts, favicon).
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
