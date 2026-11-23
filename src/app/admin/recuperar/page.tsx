import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/atoms/Logo";
import { RequestResetForm } from "./RequestResetForm";

export const metadata: Metadata = { title: "Recuperar contraseña" };

// Public: the proxy lets it through without a session (src/proxy.ts).
export default function RequestResetPage() {
  return (
    <main className="grid min-h-svh place-items-center px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-white p-8 shadow-sm">
        <Logo className="h-14 text-brand-600" />
        <h1 className="text-title mt-6 text-ink">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-graphite">Escribe el email de tu cuenta del panel y te enviamos un enlace para elegir una contraseña nueva.</p>
        <RequestResetForm />
        <Link href="/admin/login" className="mt-6 inline-block text-sm font-medium text-brand-700 underline underline-offset-2">
          Volver a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
