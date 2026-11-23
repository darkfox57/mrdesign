import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

const handler = toNextJsHandler(auth);

// Sign-in and password resets only happen through the admin server actions, which apply the
// rate limits. The HTTP endpoints would bypass them, so they are closed here. Server-side
// `auth.api.*` calls do not go through this route and keep working.
const CLOSED_PATHS = [
  "/api/auth/sign-in/",
  "/api/auth/sign-up/",
  "/api/auth/request-password-reset",
  "/api/auth/forget-password",
  "/api/auth/reset-password",
];

const closed = (request: Request) => CLOSED_PATHS.some((path) => new URL(request.url).pathname.startsWith(path));
const notFound = () => new Response("Not found", { status: 404 });

// GET too: /api/auth/reset-password/:token would otherwise tell anyone whether a token is valid.
export async function GET(request: Request) {
  return closed(request) ? notFound() : handler.GET(request);
}

export async function POST(request: Request) {
  return closed(request) ? notFound() : handler.POST(request);
}
