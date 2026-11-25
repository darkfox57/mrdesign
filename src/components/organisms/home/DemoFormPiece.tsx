"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { emailStatus, firstName } from "@/lib/home/demo-form";
import { PieceCard } from "./PieceCard";

const field =
  "min-h-12 w-full rounded-control border border-field bg-white px-3.5 text-md text-text focus:outline-2 focus:outline-offset-1 focus:outline-brand-600 aria-invalid:border-danger";

// The form piece: validates the email while the visitor types. It is a demo that sends nothing,
// and its confirmation says so. The real contact form is at the end of the page.
export function DemoFormPiece({ kinds }: { kinds: string[] }) {
  const t = useTranslations("Home.pieces");
  const id = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [kind, setKind] = useState(kinds[0]);
  const [sent, setSent] = useState(false);
  const status = emailStatus(email, touched);
  const heading = useRef<HTMLHeadingElement>(null);
  const nameField = useRef<HTMLInputElement>(null);
  // Where focus goes after the form and its confirmation swap places; null on the first render.
  const focusNext = useRef<"heading" | "name" | null>(null);

  useEffect(() => {
    const next = focusNext.current;
    focusNext.current = null;
    if (next === "heading") heading.current?.focus();
    if (next === "name") nameField.current?.focus();
  }, [sent]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (emailStatus(email, true) !== "ok") {
      setTouched(true);
      return;
    }
    focusNext.current = "heading";
    setSent(true);
  };

  const reset = () => {
    focusNext.current = "name";
    setSent(false);
    setName("");
    setEmail("");
    setTouched(false);
  };

  return (
    <PieceCard code="ContactForm" title={t("form.title")} description={t("form.description")} labels={{ skeleton: t("skeleton"), finished: t("finished") }}>
      {sent ? null : (
        <form data-reveal="assemble" data-x="FormFields" noValidate onSubmit={submit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5 text-sm font-medium">
            <label htmlFor={`${id}-name`}>{t("form.name")}</label>
            <input ref={nameField} id={`${id}-name`} type="text" autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} className={field} />
          </div>
          <div className="flex flex-col gap-1.5 text-sm font-medium">
            <label htmlFor={`${id}-email`}>{t("form.email")}</label>
            <input
              id={`${id}-email`}
              type="text"
              inputMode="email"
              autoComplete="off"
              value={email}
              aria-invalid={status === "error" ? true : undefined}
              aria-describedby={`${id}-email-message`}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched(true)}
              className={field}
            />
            <span id={`${id}-email-message`} aria-live="polite" className={cn("min-h-5 text-caption", status === "ok" ? "text-success" : "text-danger")}>
              {status === "error" ? t("form.emailError") : status === "ok" ? t("form.emailOk") : ""}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 text-sm font-medium">
            <label htmlFor={`${id}-kind`}>{t("form.kind")}</label>
            <select id={`${id}-kind`} value={kind} onChange={(event) => setKind(event.target.value)} className={field}>
              {kinds.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex min-h-12 cursor-pointer items-center justify-center self-start rounded-control bg-text px-5.5 text-md font-semibold text-paper transition-colors hover:bg-ink-high"
          >
            {t("form.submit")}
          </button>
        </form>
      )}
      {/* The live region is always there, empty until the demo "sends", so its message is announced. */}
      <div role="status" className={sent ? "flex flex-col gap-2.5 rounded-2xl border border-line bg-white p-7 motion-safe:animate-rise" : undefined}>
        {sent ? (
          <>
            <h4 ref={heading} tabIndex={-1} className="font-display-tight text-case">
              {firstName(name) ? t("form.thanks", { name: firstName(name) ?? "" }) : t("form.thanksAnonymous")}
            </h4>
            <span className="text-graphite">{t("form.thanksText")}</span>
            <button type="button" onClick={reset} className="min-h-11 cursor-pointer self-start text-caption text-graphite underline">
              {t("form.again")}
            </button>
          </>
        ) : null}
      </div>
    </PieceCard>
  );
}
