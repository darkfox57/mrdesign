import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/atoms/Logo";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Nueva contraseña" };

// Public: the proxy lets it through without a session (src/proxy.ts). The token in the link is
// checked when the form is sent, not here, so the page never says whether a token is valid.
export default async function ResetPasswordPage({ searchParams }: PageProps<"/admin/restablecer">) {
  const { token } = await searchParams;

  return (
    <main className="grid min-h-svh place-items-center px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-white p-8 shadow-sm">
        <Logo className="h-14 text-brand-600" />
        <h1 className="text-title mt-6 text-ink">Nueva contraseña</h1>
        {typeof token === "string" && token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p role="alert" className="mt-6 text-sm font-medium text-brand-700">
            Falta el enlace del email. Pide uno nuevo.
          </p>
        )}
        <Link href="/admin/recuperar" className="mt-6 inline-block text-sm font-medium text-brand-700 underline underline-offset-2">
          Pedir un enlace nuevo
        </Link>
      </div>
    </main>
  );
}
