import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/atoms/Logo";
import { getDashboardSession } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  // Only a usable session skips the form; a banned or role-less one would loop back here.
  const [session, { next }] = await Promise.all([getDashboardSession(), searchParams]);
  if (session) redirect("/admin");

  return (
    <main className="grid min-h-svh place-items-center px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-white p-8 shadow-sm">
        <Logo className="h-14 text-brand-600" />
        <h1 className="text-title mt-6 text-ink">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-graphite">Panel de administración de Mr. Design.</p>
        <LoginForm next={typeof next === "string" ? next : undefined} />
        <Link href="/admin/recuperar" className="mt-4 inline-block text-sm font-medium text-brand-700 underline underline-offset-2">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </main>
  );
}
